const dljs = require('damerau-levenshtein-js');
const { toWords } = require('number-to-words');

const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"];
const SUBCATEGORIES = [
    ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    ["American History", "Ancient History", "European History", "World History", "Other History"],
    ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"],
    ["Religion"],
    ["Mythology"],
    ["Philosophy"],
    ["Social Science"],
    ["Current Events"],
    ["Geography"],
    ["Other Academic"],
    ["Trash"]
];
const SUBCATEGORIES_FLATTENED = ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature", "American History", "Ancient History", "European History", "World History", "Other History", "Biology", "Chemistry", "Physics", "Math", "Other Science", "Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"];
const METAWORDS = ["the", "like", "descriptions", "description", "of", "do", "not", "as", "accept", "or", "other", "prompt", "on", "except", "before", "after", "is", "read", "stated", "mentioned", "at", "any", "time", "don't", "more", "specific", "etc", "eg", "answers", "word", "forms"];


function parseAnswerline(answerline) {
    const removeParentheses = (string) => {
        string = string.replace(/\([^\)]*\)/g, '');
        return string;
    }

    const splitMainAnswer = (string) => {
        let indexStart = string.indexOf('[');
        let indexEnd = string.indexOf(']');
        if (indexStart === -1) {
            return { mainAnswer: string, subAnswer: '' };
        }

        let mainAnswer = string.substring(0, indexStart).trim();
        let subAnswer = string.substring(indexStart + 1, indexEnd).trim();

        return { mainAnswer, subAnswer };
    }

    const splitIntoPhrases = (string) => {
        return string.split(';').map(token => token.trim());
    };

    const splitIntoAnswers = (phrase) => {
        phrase = phrase.toLowerCase();
        let directive = 'accept'; // by default, this phrase accepts answers that match to it
        if (phrase.startsWith('prompt')) {
            directive = 'prompt';
        } else if (phrase.startsWith('reject') || phrase.startsWith('do not accept')) {
            directive = 'reject';
        }

        phrase = phrase.replace(/^(or|prompt|prompt on|accept|reject|do not accept or prompt on|do not accept)/, '').trim();

        const answers = phrase.split(' or ').map(token => token.trim()).filter(token => token.length > 0);

        return { directive, answers };
    }

    const extractUnderlining = (string) => {
        let matches = string.match(/(?<=<u>)[^<]*(?=<\/u>)/g);
        if (matches) {
            return matches.reduce((prev, curr) => prev + curr + ' ', '').trim();
        } else {
            return string;
        }
    }

    const extractQuotes = (string) => {
        let matches = string.match(/(?<=["“‟❝])[^"”❞]*(?=["”❞])/g);
        if (matches) {
            return matches.reduce((prev, curr) => prev + curr + ' ', '').trim();
        } else {
            return string;
        }
    }

    const extractKeyWords = (string) => {
        const tokens = string.split(' ');
        return tokens.filter(token => token.length > 0 && token.match(/<[^>]*>/))
            .map(token => token.replace(/<[^>]*>/g, ''))
            .reduce((prev, curr) => prev + curr + ' ', '')
            .trim();
    }

    answerline = removeParentheses(answerline);
    let { mainAnswer, subAnswer } = splitMainAnswer(answerline);
    const subPhrases = splitIntoPhrases(subAnswer);
    const parsedAnswerline = {
        accept: [[extractUnderlining(mainAnswer), extractKeyWords(mainAnswer)]],
        prompt: [],
        reject: []
    }

    subPhrases.forEach(phrase => {
        if (phrase.length === 0) return;
        let { directive, answers } = splitIntoAnswers(phrase);
        answers.forEach(answer => {
            if (directive === 'accept' || directive === 'prompt') {
                answer = [extractUnderlining(answer), extractKeyWords(answer)];
            } else if (directive === 'reject') {
                answer = [extractQuotes(answer), ''];
            }
            parsedAnswerline[directive].push(answer);
        });
    });

    return parsedAnswerline;
}


function stringMatchesReference(string, reference) {
    if (string === null || string === undefined || reference === null || reference === undefined) {
        return false;
    }

    const removePunctuation = (string) => {
        return string.replace(/[.,!;:'"\/?@#$%^&*_~]/g, '');
    }

    const replaceSpecialCharacters = (string) => {
        return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    string = removePunctuation(string);
    string = replaceSpecialCharacters(string);
    string = string.toLowerCase().trim();
    string = string.replace('-', ' ');

    reference = removePunctuation(reference);
    reference = replaceSpecialCharacters(reference);
    reference = reference.toLowerCase().trim();
    reference = reference.replace(/<\/?[biu]>/g, '');
    reference = reference.replace(/<\/?em>/g, '');
    reference = reference.replace('-', ' ');

    if (string.length === 0) return false;

    let stringTokens = string
        .split(' ')
        .filter(token => !METAWORDS.includes(token) && token.length > 0)
        .map(token => isNaN(token) ? token : toWords(parseInt(token)));
    let referenceTokens = reference
        .split(' ')
        .filter(token => !METAWORDS.includes(token) && token.length > 0)
        .map(token => isNaN(token) ? token : toWords(parseInt(token)));

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
            let errors = dljs.distance(stringTokens[i], referenceTokens[j]);

            if (4 * errors < referenceTokens[j].length) {
                tokenMatches = true;
                break;
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
    let directive = checkAnswer(answerline, givenAnswer);
    let isCorrect = (directive === 'accept');
    return [directive, isCorrect ? (inPower ? 15 : 10) : (endOfQuestion ? 0 : -5)];
}


/**
 * 
 * @param {String} answerline 
 * @param {String} givenAnswer 
 * @param {Boolean} isFormattedAnswerline 
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

    for (const answer of parsedAnswerline['reject']) {
        if (stringMatchesReference(answer[0], givenAnswer) && stringMatchesReference(givenAnswer, answer[0])) {
            return 'reject';
        }
    }

    for (const type of ['accept', 'prompt']) {
        for (const answer of parsedAnswerline[type]) {
            if (answerWorks(answer[0], givenAnswer, isFormattedAnswerline)) return type;
            if (answerWorks(answer[1], givenAnswer, isFormattedAnswerline)) return type;
        }
    }

    return 'reject';
}


module.exports = { CATEGORIES, SUBCATEGORIES, SUBCATEGORIES_FLATTENED, checkAnswer, scoreTossup };