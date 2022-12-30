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

/**
 * Implements the Porter Stemming Algorithm.
 * Source: https://tartarus.org/martin/PorterStemmer/js.txt
 */
const stemmer = (() => {
    const step2list = {
            'ational' : 'ate',
            'tional' : 'tion',
            'enci' : 'ence',
            'anci' : 'ance',
            'izer' : 'ize',
            'bli' : 'ble',
            'alli' : 'al',
            'entli' : 'ent',
            'eli' : 'e',
            'ousli' : 'ous',
            'ization' : 'ize',
            'ation' : 'ate',
            'ator' : 'ate',
            'alism' : 'al',
            'iveness' : 'ive',
            'fulness' : 'ful',
            'ousness' : 'ous',
            'aliti' : 'al',
            'iviti' : 'ive',
            'biliti' : 'ble',
            'logi' : 'log'
        },

        step3list = {
            'icate' : 'ic',
            'ative' : '',
            'alize' : 'al',
            'iciti' : 'ic',
            'ical' : 'ic',
            'ful' : '',
            'ness' : ''
        },

        c = '[^aeiou]',          // consonant
        v = '[aeiouy]',          // vowel
        C = c + '[^aeiouy]*',    // consonant sequence
        V = v + '[aeiou]*',      // vowel sequence

        mgr0 = '^(' + C + ')?' + V + C,               // [C]VC... is m>0
        meq1 = '^(' + C + ')?' + V + C + '(' + V + ')?$',  // [C]VC[V] is m=1
        mgr1 = '^(' + C + ')?' + V + C + V + C,       // [C]VCVC... is m>1
        s_v = '^(' + C + ')?' + v;                   // vowel in stem

    return function (w) {
        let 	stem,
            suffix,
            re,
            re2,
            re3,
            re4;

        if (w.length < 3) { return w; }

        const firstch = w.substr(0,1);
        if (firstch == 'y') {
            w = firstch.toUpperCase() + w.substr(1);
        }

        // Step 1a
        re = /^(.+?)(ss|i)es$/;
        re2 = /^(.+?)([^s])s$/;

        if (re.test(w)) { w = w.replace(re,'$1$2'); }
        else if (re2.test(w)) {	w = w.replace(re2,'$1$2'); }

        // Step 1b
        re = /^(.+?)eed$/;
        re2 = /^(.+?)(ed|ing)$/;
        if (re.test(w)) {
            const fp = re.exec(w);
            re = new RegExp(mgr0);
            if (re.test(fp[1])) {
                re = /.$/;
                w = w.replace(re,'');
            }
        } else if (re2.test(w)) {
            const fp = re2.exec(w);
            stem = fp[1];
            re2 = new RegExp(s_v);
            if (re2.test(stem)) {
                w = stem;
                re2 = /(at|bl|iz)$/;
                re3 = new RegExp('([^aeiouylsz])\\1$');
                re4 = new RegExp('^' + C + v + '[^aeiouwxy]$');
                if (re2.test(w)) {	w = w + 'e'; }
                else if (re3.test(w)) { re = /.$/; w = w.replace(re,''); }
                else if (re4.test(w)) { w = w + 'e'; }
            }
        }

        // Step 1c
        re = /^(.+?)y$/;
        if (re.test(w)) {
            const fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(s_v);
            if (re.test(stem)) { w = stem + 'i'; }
        }

        // Step 2
        re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
        if (re.test(w)) {
            const fp = re.exec(w);
            stem = fp[1];
            suffix = fp[2];
            re = new RegExp(mgr0);
            if (re.test(stem)) {
                w = stem + step2list[suffix];
            }
        }

        // Step 3
        re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
        if (re.test(w)) {
            const fp = re.exec(w);
            stem = fp[1];
            suffix = fp[2];
            re = new RegExp(mgr0);
            if (re.test(stem)) {
                w = stem + step3list[suffix];
            }
        }

        // Step 4
        re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
        re2 = /^(.+?)(s|t)(ion)$/;
        if (re.test(w)) {
            const fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(mgr1);
            if (re.test(stem)) {
                w = stem;
            }
        } else if (re2.test(w)) {
            const fp = re2.exec(w);
            stem = fp[1] + fp[2];
            re2 = new RegExp(mgr1);
            if (re2.test(stem)) {
                w = stem;
            }
        }

        // Step 5
        re = /^(.+?)e$/;
        if (re.test(w)) {
            const fp = re.exec(w);
            stem = fp[1];
            re = new RegExp(mgr1);
            re2 = new RegExp(meq1);
            re3 = new RegExp('^' + C + v + '[^aeiouwxy]$');
            if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
                w = stem;
            }
        }

        re = /ll$/;
        re2 = new RegExp(mgr1);
        if (re.test(w) && re2.test(w)) {
            re = /.$/;
            w = w.replace(re,'');
        }

        // and turn initial Y back to y

        if (firstch == 'y') {
            w = firstch.toLowerCase() + w.substr(1);
        }

        return w;
    };
})();


function parseAnswerline(answerline) {
    const removeAllParentheses = (string) => {
        string = string.replace(/\([^)]*\)/g, '');
        string = string.replace(/\[[^\]]*\]/g, '');
        return string;
    };

    const removeHTMLTags = (string) => {
        return string.replace(/<[^>]*>/g, '');
    };

    const removeItalics = (string) => {
        string = string.replace(/<i>/g, '');
        string = string.replace(/<\/i>/g, '');
        return string;
    };

    const splitMainAnswer = (string) => {
        const bracketsSubAnswer = (string.match(/(?<=\[)[^\]]*(?=\])/g) ?? ['']).pop();
        const parenthesesSubAnswer = (string.match(/(?<=\()[^)]*(?=\))/g) ?? ['']).pop();

        const mainAnswer = removeAllParentheses(string);

        if (bracketsSubAnswer.length !== 0) return { mainAnswer, subAnswer: bracketsSubAnswer };

        for (const directive of ['or', 'prompt', 'antiprompt', 'anti-prompt', 'accept', 'reject', 'do not accept']) {
            if (parenthesesSubAnswer.toLowerCase().startsWith(directive)) {
                return { mainAnswer, subAnswer: parenthesesSubAnswer };
            }
        }

        return { mainAnswer, subAnswer: '' };
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

        const answers = phrase.split(/,? or |, /).map(token => token.trim()).filter(token => token.length > 0);

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

    const getAbbreviation = (string) => {
        return string
            .split(' ')
            .filter(token => token.length > 0)
            .map(token => removeHTMLTags(token))
            .map(token => token.charAt(0))
            .reduce((a, b) => a + b, '')
            .trim();
    };

    answerline = removeItalics(answerline);

    const { mainAnswer, subAnswer } = splitMainAnswer(answerline);
    const subPhrases = splitIntoPhrases(subAnswer);
    const parsedAnswerline = {
        accept: [[extractUnderlining(mainAnswer), extractKeyWords(mainAnswer), extractQuotes(mainAnswer)]],
        prompt: [],
        reject: []
    };

    parsedAnswerline.accept.push([getAbbreviation(mainAnswer), '', '']);

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
function stringMatchesReference({ string, reference, strictness = 5, acceptSubstring = false }) {
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
            if (strictness * errors <= referenceTokens[j].length || (acceptSubstring && referenceTokens[j].includes(stringTokens[i]))) {
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
            return stringMatchesReference({ string: answerline, reference: givenAnswer });
        } else {
            return stringMatchesReference({ string: givenAnswer, reference: answerline, acceptSubstring: true });
        }
    };

    const isFormattedAnswerline = answerline.includes('<u>');
    const parsedAnswerline = parseAnswerline(answerline);

    if (!isFormattedAnswerline && answerline.length > 1 && givenAnswer.length === 1 && isNaN(givenAnswer)) {
        return 'reject';
    }

    for (const answer of parsedAnswerline['reject']) {
        if (!stringMatchesReference({ string: answer[2], reference: givenAnswer, strictness: 11 })) {
            continue;
        }

        if (!stringMatchesReference({ string: givenAnswer, reference: answer[2], strictness: 11 })) {
            continue;
        }

        return 'reject';
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
