const dljs = require('damerau-levenshtein-js');
const { toWords } = require('number-to-words');

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CATEGORIES = ['Literature', 'History', 'Science', 'Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
const SUBCATEGORIES = [
    ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
    ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
    ['Biology', 'Chemistry', 'Physics', 'Math', 'Other Science'],
    ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
    ['Religion'],
    ['Mythology'],
    ['Philosophy'],
    ['Social Science'],
    ['Current Events'],
    ['Geography'],
    ['Other Academic'],
    ['Trash']
];
const SUBCATEGORIES_FLATTENED = ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature', 'American History', 'Ancient History', 'European History', 'World History', 'Other History', 'Biology', 'Chemistry', 'Physics', 'Math', 'Other Science', 'Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
/**
 * Subcategories flattened, but also includes the 4 optional subcategories
 * "Long Fiction", "Short Fiction", "Poetry", and "Drama".
 */
const SUBCATEGORIES_FLATTENED_ALL = ['Long Fiction', 'Short Fiction', 'Poetry', 'Drama', 'American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature', 'American History', 'Ancient History', 'European History', 'World History', 'Other History', 'Biology', 'Chemistry', 'Physics', 'Math', 'Other Science', 'Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
const METAWORDS = ['the', 'like', 'descriptions', 'description', 'of', 'do', 'not', 'as', 'accept', 'or', 'other', 'prompt', 'on', 'except', 'before', 'after', 'is', 'read', 'stated', 'mentioned', 'at', 'any', 'don\'t', 'more', 'specific', 'etc', 'eg', 'answers', 'word', 'forms'];


function parseAnswerline(answerline) {
    const removeParentheses = (string) => {
        string = string.replace(/\([^)]*\)/g, '');
        return string;
    };

    const removeItalics = (string) => {
        string = string.replace(/<i>/g, '');
        string = string.replace(/<\/i>/g, '');
        return string;
    };

    const splitMainAnswer = (string) => {
        const indexStart = string.indexOf('[');
        const indexEnd = string.indexOf(']');
        if (indexStart === -1) {
            return { mainAnswer: string, subAnswer: '' };
        }

        const mainAnswer = string.substring(0, indexStart).trim();
        const subAnswer = string.substring(indexStart + 1, indexEnd).trim();

        return { mainAnswer, subAnswer };
    };

    const splitIntoPhrases = (string) => {
        return string.split(';').map(token => token.trim());
    };

    const splitIntoAnswers = (phrase) => {
        phrase = phrase.toLowerCase();
        let directive = 'accept'; // by default, this phrase accepts answers that match to it
        if (phrase.startsWith('prompt')) {
            directive = 'prompt';
        } else if (phrase.startsWith('antiprompt') || phrase.startsWith('anti-prompt')) {
            directive = 'accept';
        } else if (phrase.startsWith('reject') || phrase.startsWith('do not accept')) {
            directive = 'reject';
        }

        phrase = phrase.replace(/^(or|prompt|prompt on|antiprompt|antiprompt on|anti-prompt|anti-prompt on|accept|reject|do not accept or prompt on|do not accept)/, '').trim();

        const answers = phrase.split(/ or |, /).map(token => token.trim()).filter(token => token.length > 0);

        return { directive, answers };
    };

    const extractUnderlining = (string) => {
        const matches = string.match(/(?<=<u>)[^<]*(?=<\/u>)/g);
        if (matches) {
            return matches.reduce((prev, curr) => prev + curr + ' ', '').trim();
        } else {
            return string;
        }
    };

    const extractQuotes = (string) => {
        const matches = string.match(/(?<=["“‟❝])[^"”❞]*(?=["”❞])/g);
        if (matches) {
            return matches.reduce((prev, curr) => prev + curr + ' ', '').trim();
        } else {
            return string;
        }
    };

    /**
     * Get all words which are partially or wholly underlined.
     */
    const extractKeyWords = (string) => {
        const tokens = string.split(' ');
        return tokens.filter(token => token.length > 0 && token.match(/<[^>]*>/))
            .map(token => token.replace(/<[^>]*>/g, ''))
            .reduce((prev, curr) => prev + curr + ' ', '')
            .trim();
    };

    answerline = removeParentheses(answerline);
    answerline = removeItalics(answerline);

    const { mainAnswer, subAnswer } = splitMainAnswer(answerline);
    const subPhrases = splitIntoPhrases(subAnswer);
    const parsedAnswerline = {
        accept: [[extractUnderlining(mainAnswer), extractKeyWords(mainAnswer), extractQuotes(mainAnswer)]],
        prompt: [],
        reject: []
    };

    if (mainAnswer.includes(' or ')) {
        const parts = mainAnswer.split(' or ');
        parsedAnswerline.accept.push([extractUnderlining(parts[0]), extractKeyWords(parts[0]), extractQuotes(parts[0])]);
        parsedAnswerline.accept.push([extractUnderlining(parts[1]), extractKeyWords(parts[1]), extractQuotes(parts[1])]);
    }

    subPhrases.forEach(phrase => {
        if (phrase.length === 0) return;
        const { directive, answers } = splitIntoAnswers(phrase);
        answers.forEach(answer => {
            if (directive === 'accept' || directive === 'prompt') {
                answer = [extractUnderlining(answer), extractKeyWords(answer), extractQuotes(answer)];
            } else if (directive === 'reject') {
                answer = ['', '', extractQuotes(answer)];
            }
            parsedAnswerline[directive].push(answer);
        });
    });

    return parsedAnswerline;
}


/**
 *
 * @param {String} string
 * @param {String} reference
 * @param {Number} strictness - the number of characters per error allowed for two tokens to match.
 * @returns {Boolean}
 */
function stringMatchesReference(string, reference, strictness = 5) {
    if (string === null || string === undefined || reference === null || reference === undefined) {
        return false;
    }

    const removePunctuation = (string) => {
        return string.replace(/[.,!;:'"\\/?@#$%^&*_~]/g, '');
    };

    const replaceSpecialCharacters = (string) => {
        return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    const replaceSpecialPhrases = (string) => {
        if (string.match(/dr\.?/)) return 'doctor';

        return string;
    };

    const stemmer = (string) => {
        if (string.charAt(string.length - 1) === 's') {
            return string.substring(0, string.length - 1);
        } else {
            return string;
        }
    };

    string = removePunctuation(string);
    string = replaceSpecialCharacters(string);
    string = string.toLowerCase().trim();
    string = string.replace(/<\/?[biu]>/g, '');
    string = string.replace(/<\/?em>/g, '');
    string = string.replace('-', ' ');

    reference = removePunctuation(reference);
    reference = replaceSpecialCharacters(reference);
    reference = reference.toLowerCase().trim();
    reference = reference.replace(/<\/?[biu]>/g, '');
    reference = reference.replace(/<\/?em>/g, '');
    reference = reference.replace('-', ' ');

    if (string.length === 0) return false;

    const stringTokens = string
        .split(' ')
        .filter(token => !METAWORDS.includes(token) && token.length > 0);

    for (let i = stringTokens.length - 1; i >= 0; i--) {
        if (isFinite(stringTokens[i])) {
            stringTokens.push(toWords(parseInt(stringTokens[i])));
        }
    }

    const referenceTokens = reference
        .split(' ')
        .filter(token => !METAWORDS.includes(token) && token.length > 0)
        .map(string => replaceSpecialPhrases(string));

    for (let i = referenceTokens.length - 1; i >= 0; i--) {
        if (isFinite(referenceTokens[i])) {
            referenceTokens.push(toWords(parseInt(referenceTokens[i])));
        }
    }

    if (stringTokens.length === 0) {
        return false;
    }

    if (referenceTokens.length === 0) {
        return false;
    }

    // check if every token in the string is in the reference
    for (let i = 0; i < stringTokens.length; i++) {
        let tokenMatches = false;

        for (let j = 0; j < referenceTokens.length; j++) {
            const errors = dljs.distance(stemmer(stringTokens[i]), stemmer(referenceTokens[j]));

            // console.log(stringTokens[i], referenceTokens[j]);
            if (strictness * errors <= referenceTokens[j].length || referenceTokens[j].includes(stringTokens[i])) {
                tokenMatches = true;
                break;
            } else {
                // console.log(errors, stringTokens[j], referenceTokens[j]);
            }
        }

        if (!tokenMatches) {
            return false;
        }
    }

    return true;
}


/**
 * @param {String} answerline
 * @param {String} givenAnswer
 * @param {Boolean} inPower
 * @param {Boolean} endOfQuestion
 * @returns {['accept' | 'prompt' | 'reject', Number]} - [directive, points]
 */
function scoreTossup(answerline, givenAnswer, inPower, endOfQuestion) {
    const directive = checkAnswer(answerline, givenAnswer);
    const isCorrect = (directive === 'accept');
    return [directive, isCorrect ? (inPower ? 15 : 10) : (endOfQuestion ? 0 : -5)];
}


/**
 *
 * @param {String} answerline
 * @param {String} givenAnswer
 * @returns {'accept' | 'prompt' | 'reject'}
 */
function checkAnswer(answerline, givenAnswer) {
    const answerWorks = (answerline, givenAnswer, isFormattedAnswerline) => {
        if (isFormattedAnswerline) {
            return stringMatchesReference(answerline, givenAnswer);
        } else {
            return stringMatchesReference(givenAnswer, answerline);
        }
    };

    const isFormattedAnswerline = answerline.includes('<u>');
    const parsedAnswerline = parseAnswerline(answerline);

    if (!isFormattedAnswerline && answerline.length > 1 && givenAnswer.length === 1 && isNaN(givenAnswer)) {
        return 'reject';
    }

    for (const answer of parsedAnswerline['reject']) {
        if (stringMatchesReference(answer[2], givenAnswer, 11) && stringMatchesReference(givenAnswer, answer[2], 11)) {
            return 'reject';
        }
    }

    if (answerline.includes('[accept either') || answerline.includes('(accept either')) {
        const [answer1, answer2] = parsedAnswerline.accept[0][0].split(' ');
        if (answerWorks(answer1, givenAnswer, isFormattedAnswerline)) {
            return 'accept';
        }
        if (answerWorks(answer2, givenAnswer, isFormattedAnswerline)) {
            return 'accept';
        }
    }

    for (const type of ['accept', 'prompt']) {
        for (const answer of parsedAnswerline[type]) {
            if (answerWorks(answer[0], givenAnswer, isFormattedAnswerline)) return type;
            if (answerWorks(answer[1], givenAnswer, isFormattedAnswerline)) return type;
            if (answerWorks(answer[2], givenAnswer, isFormattedAnswerline)) return type;
        }
    }

    if (/[[(]prompt on (a )?partial/.test(answerline)) {
        const [answer1, answer2] = parsedAnswerline.accept[0][0].split(' ');
        if (answerWorks(answer1, givenAnswer, isFormattedAnswerline)) {
            return 'prompt';
        }
        if (answerWorks(answer2, givenAnswer, isFormattedAnswerline)) {
            return 'prompt';
        }
    }

    return 'reject';
}


module.exports = { DIFFICULTIES, CATEGORIES, SUBCATEGORIES, SUBCATEGORIES_FLATTENED, SUBCATEGORIES_FLATTENED_ALL, checkAnswer, scoreTossup };
