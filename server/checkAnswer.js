import { distance } from 'damerau-levenshtein-js';
import numberToWords from 'number-to-words';
import { toArabic } from 'roman-numerals';
import { stemmer } from 'stemmer';

const { toWords } = numberToWords;


/**
 * Parses the answerline, returning the acceptable, promptable, and rejectable answers.
 */
const parseAnswerline = (() => {
    const removeParentheses = (string) => {
        return string
            .replace(/\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]/g, '');
    };


    const removeHTMLTags = (string) => {
        return string.replace(/<[^>]*>/g, '');
    };


    const removeItalics = (string) => {
        return string.replace(/<\/?i>/g, '');
    };

    const replaceSpecialSubstrings = (string) => {
        return string
            .replace(/\(s\)/g, 's')
            .replace(/\p{Pd}/gu, '-'); // replace all dashes with the same dash
    };


    const splitMainAnswer = (string) => {
        const bracketsSubAnswer = (string.match(/(?<=\[)[^\]]*(?=\])/g) ?? ['']).pop();
        const parenthesesSubAnswer = (string.match(/(?<=\()[^)]*(?=\))/g) ?? ['']).pop();

        const mainAnswer = removeParentheses(string);

        if (bracketsSubAnswer.length !== 0)
            return { mainAnswer, subAnswer: bracketsSubAnswer };

        for (const directive of ['or', 'prompt', 'antiprompt', 'anti-prompt', 'accept', 'reject', 'do not accept']) {
            if (parenthesesSubAnswer.startsWith(directive))
                return { mainAnswer, subAnswer: parenthesesSubAnswer };
        }

        return { mainAnswer, subAnswer: '' };
    };


    const splitIntoPhrases = (string) => {
        return string.split(';').map(token => token.trim());
    };


    const splitIntoAnswers = (phrase) => {
        let directive = 'accept'; // by default, this phrase accepts answers that match to it
        if (phrase.startsWith('prompt')) {
            directive = 'prompt';
        } else if (phrase.startsWith('antiprompt') || phrase.startsWith('anti-prompt')) {
            directive = 'accept';
        } else if (phrase.startsWith('reject') || phrase.startsWith('do not accept')) {
            directive = 'reject';
        }

        phrase = phrase.replace(/^(or|prompt|prompt on|antiprompt|antiprompt on|anti-prompt|anti-prompt on|accept|reject|do not accept or prompt on|do not accept)/, '').trim();

        const answers = phrase.split(/,? or |, /).map(token => token.trim()).filter(token => token.length > 0);

        return { directive, answers };
    };


    const extractUnderlining = (string) => {
        const matches = string.match(/(?<=<u>)[^<]*(?=<\/u>)/g);
        if (!matches) {
            return removeHTMLTags(string);
        }

        return removeHTMLTags(matches.reduce((prev, curr) => prev + curr + ' ', '').trim());
    };


    const extractQuotes = (string) => {
        const matches = string.match(/(?<=["“‟❝])[^"”❞]*(?=["”❞])/g);
        if (!matches) {
            return removeHTMLTags(string);
        }

        return removeHTMLTags(matches.reduce((prev, curr) => prev + ' ' + curr, '').trim());
    };


    /**
     * Get all words which are partially or wholly underlined.
     */
    const extractKeyWords = (string) => {
        const requiredWords = extractUnderlining(string).split(' ');

        string = string
            .split(' ')
            .filter(token => token.length > 0)
            .filter(token => token.match(/<\/?u>/) || requiredWords.includes(token))
            .reduce((prev, curr) => prev + curr + ' ', '')
            .trim();

        return removeHTMLTags(string);
    };


    const getAbbreviation = (string) => {
        return string
            .split(' ')
            .filter(token => token.length > 0)
            .map(token => removeHTMLTags(token).charAt(0))
            .reduce((a, b) => a + b, '')
            .trim();
    };


    const getEquivalentAnswers = (string) => {
        string = string.toLowerCase();
        string = removeHTMLTags(string);
        switch (string) {
        case 'atomic bombs':
        case 'nuclear weapons':
        case 'nukes':
            return ['atomic bombs', 'atomic weapons', 'nuclear bombs', 'nuclear weapons', 'nukes', 'fission bombs', 'A-bombs'];
        case 'house':
            return ['home'];
        case 'mouse':
            return ['mice'];
        case 'rail':
        case 'railroad':
            return ['rail', 'railroad'];
        case 'nineteen eighty-four':
        case 'nineteen eighty four':
            return ['1984'];
        case 'oxidation number':
        case 'oxidation state':
            return ['oxidation number', 'oxidation state'];
        case 'ralph vaughan-williams':
            return ['rvw'];
        case 'spacewalk':
            return ['space walk'];
        case 'sugar cane':
        case 'sugarcane':
            return ['sugar cane', 'sugarcane'];
        case 'wavefunction':
        case 'wave function':
            return ['wave function', 'wavefunction'];
        case 'world war 1':
        case 'world war i':
        case 'world war one':
            return [
                'first world war',
                'great war',
            ];
        case 'world war ii':
        case 'world war two':
        case 'world war 2':
            return [
                'ww2',
                'wwii',
                'world war ii',
                'world war 2',
                'world war two',
                'second world war',
            ];
        }

        return null;
    };


    /**
     * @param {String} answerline
     */
    return (answerline) => {
        answerline = removeItalics(answerline);
        answerline = replaceSpecialSubstrings(answerline);

        const { mainAnswer, subAnswer } = splitMainAnswer(answerline);
        const subPhrases = splitIntoPhrases(subAnswer);
        /**
         * @type {{ "accept": String[], "prompt": String[][2], "reject": String[] }}
         */
        const parsedAnswerline = {
            accept: [extractUnderlining(mainAnswer), extractKeyWords(mainAnswer), extractQuotes(mainAnswer)],
            prompt: [],
            reject: [],
        };

        if (getAbbreviation(mainAnswer).length > 1) {
            parsedAnswerline.accept.push(getAbbreviation(mainAnswer));
        }

        if (getAbbreviation(extractUnderlining(mainAnswer)).length > 1) {
            parsedAnswerline.accept.push(getAbbreviation(extractUnderlining(mainAnswer)));
        }

        if (mainAnswer.includes(' or ')) {
            const parts = mainAnswer.split(' or ');
            for (const part of parts) {
                parsedAnswerline.accept.push(extractUnderlining(part), extractKeyWords(part), extractQuotes(part));
            }
        }

        for (const answer of parsedAnswerline.accept) {
            if (/-/.test(answer)) {
                const answer1 = answer.replace(/-/g, ' ');
                const answer2 = answer.replace(/-/g, '');
                parsedAnswerline.accept.push(extractUnderlining(answer1), extractKeyWords(answer1), extractQuotes(answer1));
                parsedAnswerline.accept.push(extractUnderlining(answer2), extractKeyWords(answer2), extractQuotes(answer2));
            }

            const specialAnswers = getEquivalentAnswers(answer);
            if (specialAnswers !== null)
                parsedAnswerline.accept = parsedAnswerline.accept.concat(specialAnswers);
        }

        subPhrases.forEach(phrase => {
            if (phrase.length === 0)
                return;

            let directedPrompt = null;

            for (const key of ['by asking', 'with']) {
                const index = phrase.indexOf(key);

                if (index < 0)
                    continue;

                directedPrompt = extractQuotes(phrase.slice(index + key.length));
                phrase = phrase.slice(0, index);
                break;
            }

            const { directive, answers } = splitIntoAnswers(phrase);

            for (const answer of answers) {
                switch (directive) {
                case 'accept':
                    parsedAnswerline[directive].push(extractUnderlining(answer), extractKeyWords(answer), extractQuotes(answer));
                    break;
                case 'prompt': {
                    parsedAnswerline[directive].push([extractUnderlining(answer), directedPrompt]);
                    parsedAnswerline[directive].push([extractKeyWords(answer), directedPrompt]);
                    parsedAnswerline[directive].push([extractQuotes(answer), directedPrompt]);
                    break;
                }
                case 'reject':
                    parsedAnswerline[directive].push(extractQuotes(answer));
                    break;
                }

                if (/-/.test(answer)) {
                    // NOTE: the loop will eventually run again on this modified answer
                    answers.push(answer.replace(/-/g, ' '));
                    answers.push(answer.replace(/-/g, ''));
                }
            }
        });

        return parsedAnswerline;
    };
})();


/**
 * Returns true if and only if every token in `string` is present in `reference`.
 * @param {String} string
 * @param {String} reference
 * @param {Number} strictness - the number of characters per error allowed for two tokens to match.
 * @returns {Boolean}
 */
const stringMatchesReference = (() => {
    const removePunctuation = (string) => {
        return string.replace(/[.,!;:'"\\/?@#$%^&*_~’]/g, '');
    };


    const replaceSpecialCharacters = (string) => {
        return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };


    const replaceSpecialPhrases = (string) => {
        switch (string) {
        case 'dr':
        case 'dr.':
            return 'doctor';

        case 'st':
        case 'st.':
            return 'saint';

        // ordinals
        case '1st':
            return 'first';
        case '2nd':
            return 'second';
        case '3rd':
            return 'third';
        case '4th':
            return 'fourth';
        case '5th':
            return 'fifth';
        case '6th':
            return 'sixth';
        case '7th':
            return 'seventh';
        case '8th':
            return 'eighth';
        case '9th':
            return 'ninth';
        case '10th':
            return 'tenth';

        // units
        case 'cm':
            return 'centimeter';
        case 'mm':
            return 'millimeter';

        // typoes
        case 'contentinal':
            return 'continental';
        }

        return string;
    };


    return ({ string, reference, strictness = 5, acceptSubstring = false, useStemmer = true }) => {
        if (string === null || string === undefined || reference === null || reference === undefined)
            return false;

        if (string.length === 0)
            return false;

        string = removePunctuation(string);
        string = replaceSpecialCharacters(string);
        string = string.trim();

        reference = removePunctuation(reference);
        reference = replaceSpecialCharacters(reference);
        reference = reference.trim();

        const stringTokens = string
            .split(' ')
            .filter(token => token.length > 0)
            .map(string => replaceSpecialPhrases(string));

        if (stringTokens.length === 0)
            return false;

        for (let i = stringTokens.length - 1; i >= 0; i--) {
            if (stringTokens[i].endsWith('s')) {
                stringTokens[i] = stringTokens[i].slice(0, -1);
            }

            try {
                stringTokens[i] = toArabic(stringTokens[i]);
            } catch (e) {
                if (e.message !== 'toArabic expects a valid roman number' && !(e instanceof TypeError)) {
                    throw e;
                }
            }

            if (isFinite(stringTokens[i])) {
                stringTokens[i] = parseInt(stringTokens[i]);
            } else {
                continue;
            }

            if (stringTokens[i] <= 100) {
                stringTokens[i] = toWords(stringTokens[i]);
            } else {
                stringTokens[i] = stringTokens[i].toString();
            }
        }

        const referenceTokens = reference
            .split(' ')
            .filter(token => token.length > 0)
            .map(string => replaceSpecialPhrases(string));

        if (referenceTokens.length === 0)
            return false;

        for (let i = referenceTokens.length - 1; i >= 0; i--) {
            if (referenceTokens[i].endsWith('s')) {
                referenceTokens[i] = referenceTokens[i].slice(0, -1);
            }

            try {
                referenceTokens[i] = toArabic(referenceTokens[i]);
            } catch (e) {
                if (e.message !== 'toArabic expects a valid roman number' && !(e instanceof TypeError)) {
                    throw e;
                }
            }

            if (isFinite(referenceTokens[i])) {
                referenceTokens[i] = parseInt(referenceTokens[i]);
            } else {
                continue;
            }

            if (referenceTokens[i] <= 100) {
                referenceTokens[i] = toWords(referenceTokens[i]);
            } else {
                referenceTokens[i] = referenceTokens[i].toString();
            }
        }

        // console.log(stringTokens, referenceTokens);

        // check if every token in the string is in the reference
        for (let i = 0; i < stringTokens.length; i++) {
            let tokenMatches = false;

            for (let j = 0; j < referenceTokens.length; j++) {
                let errors;

                if (useStemmer) {
                    errors = distance(stemmer(stringTokens[i]), stemmer(referenceTokens[j]));
                } else {
                    errors = distance(stringTokens[i], referenceTokens[j]);
                }

                if (strictness * errors <= referenceTokens[j].length || (acceptSubstring && referenceTokens[j].includes(stringTokens[i]))) {
                    tokenMatches = true;
                    break;
                }
            }

            if (!tokenMatches) {
                return false;
            }
        }

        return true;
    };
})();

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
    givenAnswer = givenAnswer.toLowerCase();

    const answerWorks = (answerline, givenAnswer, answerlineIsFormatted) => {
        if (answerlineIsFormatted) {
            return stringMatchesReference({ string: answerline, reference: givenAnswer });
        } else {
            return stringMatchesReference({ string: givenAnswer, reference: answerline, acceptSubstring: true });
        }
    };

    const answerlineIsFormatted = answerline.includes('<u>');
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

    if (/[[(]accept either/i.test(answerline) || /[[(]accept any/i.test(answerline)) {
        for (const answer of parsedAnswerline.accept[0].split(' ')) {
            if (answerWorks(answer, givenAnswer, answerlineIsFormatted)) {
                return { directive: 'accept', directedPrompt: null };
            }
        }
    }

    for (const answer of parsedAnswerline.accept) {
        if (answerWorks(answer, givenAnswer, answerlineIsFormatted)) {
            return { directive: 'accept', directedPrompt: null };
        }
    }

    for (const answer of parsedAnswerline.prompt) {
        const directedPrompt = answer[1];
        if (answerWorks(answer[0], givenAnswer, answerlineIsFormatted)) {
            return { directive: 'prompt', directedPrompt: directedPrompt };
        }
    }

    if (/prompt on (a )?partial/.test(answerline)) {
        for (const answer of parsedAnswerline.accept[0].split(' ')) {
            if (answerWorks(answer, givenAnswer, answerlineIsFormatted)) {
                return { directive: 'prompt', directedPrompt: null };
            }
        }
    }

    return { directive: 'reject', directedPrompt: null };
}


export default checkAnswer;
