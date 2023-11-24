import * as utils from './utils.js';
import getEquivalentAnswers from './equivalent-answers.js';
import standardizeTokens from './standardize-tokens.js';

import { distance } from 'damerau-levenshtein-js';
import numberToWords from 'number-to-words';
import { toArabic } from 'roman-numerals';
import { stemmer } from 'stemmer';

const { toWords } = numberToWords;

/**
 * Splits a string into the main answer and the sub-answer (everything in brackets or parentheses),
 * while intelligently detecting whether to keep the part in parentheses, if present.
 * @param {string} string
 * @returns {{ mainAnswer: string, subAnswer: string }}
 */
const splitMainAnswer = (string) => {
    const bracketsSubAnswer = (string.match(/(?<=\[)[^\]]*(?=\])/g) ?? ['']).pop();
    const parenthesesSubAnswer = (string.match(/(?<=\()[^)]*(?=\))/g) ?? ['']).pop();

    const mainAnswer = utils.removeParentheses(string);

    if (bracketsSubAnswer.length !== 0)
        return { mainAnswer, subAnswer: bracketsSubAnswer };

    for (const directive of ['or', 'prompt', 'antiprompt', 'anti-prompt', 'accept', 'reject', 'do not accept']) {
        if (parenthesesSubAnswer.startsWith(directive))
            return { mainAnswer, subAnswer: parenthesesSubAnswer };
    }

    return { mainAnswer, subAnswer: '' };
};

/**
 * Split either the main- or sub-answerline into clauses.
 * @param {string} string
 * @returns {string[]} the clauses in the string
 */
const splitAnswerlineIntoClauses = (string) => {
    return string.split(';').map(token => token.trim());
};

/**
 *
 * @param {string} clause
 * @returns {{directive: "accept" | "reject" | "prompt", answers: string[], directedPrompt: string?}} the answers in the clause
 */
const splitClauseIntoAnswers = (clause) => {
    let directive = 'accept'; // by default, this clause accepts answers that match to it
    if (clause.startsWith('prompt')) {
        directive = 'prompt';
    } else if (clause.startsWith('antiprompt') || clause.startsWith('anti-prompt')) {
        directive = 'accept';
    } else if (clause.startsWith('reject') || clause.startsWith('do not accept')) {
        directive = 'reject';
    }

    let directedPrompt = null;
    if (directive === 'prompt') {
        for (const key of ['by asking', 'with']) {
            const index = clause.indexOf(key);

            if (index < 0) {
                continue;
            }

            directedPrompt = utils.extractQuotes(clause.slice(index + key.length));
            clause = clause.slice(0, index);
            break;
        }
    }

    clause = clause.replace(/^(or|prompt|prompt on|antiprompt|antiprompt on|anti-prompt|anti-prompt on|accept|reject|do not accept or prompt on|do not accept)/, '').trim();

    const answers = clause.split(/,? or |, /).map(token => token.trim()).filter(token => token.length > 0);

    return { directive, answers, directedPrompt };
};


/**
 * Parses the answerline, returning the acceptable, promptable, and rejectable answers.
 * @param {string} answerline
 */
function parseAnswerline(answerline) {
    answerline = utils.removeItalics(answerline);
    answerline = utils.replaceSpecialCharacters(answerline);
    answerline = utils.replaceSpecialSubstrings(answerline);

    const { mainAnswer, subAnswer } = splitMainAnswer(answerline);
    const mainAnswers = mainAnswer.split(' or ').map(token => token.trim()).filter(token => token.length > 0);

    /**
     * @type {{ "accept": String[], "prompt": String[][2], "reject": String[] }}
     */
    const parsedAnswerline = {
        accept: [],
        prompt: [],
        reject: [],
    };

    for (const answer of mainAnswers) {
        parsedAnswerline.accept.push(utils.extractUnderlining(answer), utils.extractKeyWords(answer), utils.extractQuotes(answer));
    }

    if (utils.getAbbreviation(mainAnswer).length > 1) {
        parsedAnswerline.accept.push(utils.getAbbreviation(mainAnswer));
    }

    if (utils.getAbbreviation(utils.extractUnderlining(mainAnswer)).length > 1) {
        parsedAnswerline.accept.push(utils.getAbbreviation(utils.extractUnderlining(mainAnswer)));
    }

    if (/[[(]accept either/i.test(answerline) || /[[(]accept any/i.test(answerline)) {
        for (const answer of parsedAnswerline.accept[0].split(' ')) {
            parsedAnswerline.accept.push(answer);
        }
    }

    if (/prompt on (a )?partial/.test(answerline)) {
        for (const answer of parsedAnswerline.accept[0].split(' ')) {
            parsedAnswerline.prompt.push([answer, null]);
        }
    }

    for (const answer of parsedAnswerline.accept) {
        const equivalentAnswers = getEquivalentAnswers(answer);
        parsedAnswerline.accept = parsedAnswerline.accept.concat(equivalentAnswers);
    }

    const clauses = splitAnswerlineIntoClauses(subAnswer);
    clauses.forEach(clause => {
        if (clause.length === 0)
            return;

        const { directive, answers, directedPrompt } = splitClauseIntoAnswers(clause);

        for (const answer of answers) {
            switch (directive) {
            case 'accept':
                parsedAnswerline[directive].push(utils.extractUnderlining(answer), utils.extractKeyWords(answer), utils.extractQuotes(answer));
                break;
            case 'prompt': {
                parsedAnswerline[directive].push([utils.extractUnderlining(answer), directedPrompt]);
                parsedAnswerline[directive].push([utils.extractKeyWords(answer), directedPrompt]);
                parsedAnswerline[directive].push([utils.extractQuotes(answer), directedPrompt]);
                break;
            }
            case 'reject':
                parsedAnswerline[directive].push(utils.extractQuotes(answer));
                break;
            }
        }
    });

    return parsedAnswerline;
}


const generateTokens = (string) => {
    const tokens = string.split(' ')
        .filter(token => token.length > 0)
        .map(string => standardizeTokens(string));

    for (let i = tokens.length - 1; i >= 0; i--) {
        if (tokens[i].endsWith('s')) {
            tokens[i] = tokens[i].slice(0, -1);
        }

        try {
            tokens[i] = toArabic(tokens[i]);
        } catch (e) {
            if (e.message !== 'toArabic expects a valid roman number' && !(e instanceof TypeError)) {
                throw e;
            }
        }

        if (isFinite(tokens[i])) {
            tokens[i] = parseInt(tokens[i]);
        } else {
            continue;
        }

        if (tokens[i] <= 100) {
            tokens[i] = toWords(tokens[i]);
        } else {
            tokens[i] = tokens[i].toString();
        }
    }

    return tokens;
};


/**
 * Helper method to check if every token in `given` is present in `reference`.
 * @param {string[]} given
 * @param {string[]} reference
 * @param {boolean} acceptSubstring
 * @param {number} strictness
 * @param {boolean} useStemmer
 * @returns
 */
function tokenListsMatch(given, reference, acceptSubstring, strictness, useStemmer) {
    let j = 0;
    for (let i = 0; i < given.length; i++) {
        let matches = false;

        while (j < reference.length && matches === false) {
            let errors;

            if (useStemmer) {
                errors = distance(stemmer(given[i]), stemmer(reference[j]));
            } else {
                errors = distance(given[i], reference[j]);
            }

            if (strictness * errors <= reference[j].length) {
                matches = true;
            }

            if (acceptSubstring && reference[j].includes(given[i])) {
                matches = true;
            }

            j++;
        }

        if (!matches) {
            return false;
        }
    }

    return true;
}

/**
 * Returns true if and only if every token in `string` is present in `reference`.
 * @param {String} string
 * @param {String} reference
 * @param {Number} strictness - the number of characters per error allowed for two tokens to match.
 * @param {Boolean} acceptSubstring - whether or not to accept substrings.
 * @param {Boolean} useStemmer - whether or not to use a stemmer.
 * @param {Boolean} respectOrder - whether or not to respect the order of the tokens (i.e. "a b" is not the same as "b a").
 * @returns {Boolean}
 */
function stringMatchesReference({ string, reference, strictness = 5, acceptSubstring = false, useStemmer = true, respectOrder = false }) {
    if (string === null || string === undefined || reference === null || reference === undefined)
        return false;

    if (string.length === 0)
        return false;

    string = utils.removePunctuation(string).trim();
    reference = utils.removePunctuation(reference).trim();

    let stringTokenLists = [];
    let referenceTokenLists = [];

    if (/-/.test(string)) {
        stringTokenLists.push(generateTokens(string.replace(/-/g, ' ')));
        stringTokenLists.push(generateTokens(string.replace(/-/g, '')));
    } else {
        stringTokenLists.push(generateTokens(string));
    }

    if (/-/.test(reference)) {
        referenceTokenLists.push(generateTokens(reference.replace(/-/g, ' ')));
        referenceTokenLists.push(generateTokens(reference.replace(/-/g, '')));
    } else {
        referenceTokenLists.push(generateTokens(reference));
    }

    if (!respectOrder) {
        stringTokenLists = stringTokenLists.map(tokenList => tokenList.sort());
        referenceTokenLists = referenceTokenLists.map(tokenList => tokenList.sort());
    }

    // check if every token in the string is in the reference
    for (const stringTokenList of stringTokenLists) {
        for (const referenceTokenList of referenceTokenLists) {
            if (tokenListsMatch(stringTokenList, referenceTokenList, acceptSubstring, strictness, useStemmer)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check if the given answer matches the answerline.
 * @param {String} answerline
 * @param {String} givenAnswer
 * @returns {{
    * directive: 'accept' | 'prompt' | 'reject',
    * directedPrompt: String | null
 * }}
 */
function checkAnswer(answerline, givenAnswer) {
    answerline = answerline.toLowerCase();
    givenAnswer = utils.replaceSpecialCharacters(givenAnswer.toLowerCase());
    const answerlineIsFormatted = answerline.includes('<u>');

    const answerWorks = (answerline, givenAnswer) => {
        if (answerlineIsFormatted) {
            return stringMatchesReference({ string: answerline, reference: givenAnswer });
        } else {
            return stringMatchesReference({ string: givenAnswer, reference: answerline, acceptSubstring: true });
        }
    };

    const parsedAnswerline = parseAnswerline(answerline);

    if (!answerlineIsFormatted && parsedAnswerline.accept[0].length > 1 && givenAnswer.length === 1 && isNaN(givenAnswer))
        return { directive: 'reject', directedPrompt: null };

    for (const answer of parsedAnswerline.reject) {
        const useStemmer = (stemmer(answer) !== stemmer(parsedAnswerline.accept[0]));

        if (!stringMatchesReference({ string: answer, reference: givenAnswer, strictness: 11, useStemmer }))
            continue;

        if (!stringMatchesReference({ string: givenAnswer, reference: answer, strictness: 11, useStemmer }))
            continue;

        return { directive: 'reject', directedPrompt: null };
    }

    for (const answer of parsedAnswerline.accept) {
        if (answerWorks(answer, givenAnswer)) {
            return { directive: 'accept', directedPrompt: null };
        }
    }

    for (const answer of parsedAnswerline.prompt) {
        const directedPrompt = answer[1];
        if (answerWorks(answer[0], givenAnswer)) {
            return { directive: 'prompt', directedPrompt: directedPrompt };
        }
    }

    return { directive: 'reject', directedPrompt: null };
}


export default checkAnswer;
