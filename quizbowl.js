const dljs = require('damerau-levenshtein-js');

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


function checkAnswerCorrectness(answer, givenAnswer) {
    answer = answer.toLowerCase().trim();
    answer = answer.replace(/<\/?[biu]>/g, '');
    answer = answer.replace(/<\/?em>/g, '');
    answer = answer.replace(/[.,!;:'"\/?@#$%^&*_~]/g, '');
    answer = answer.replace('-', ' ');

    givenAnswer = givenAnswer.toLowerCase().trim();
    givenAnswer = givenAnswer.replace(/[.,!;:'"\/?@#$%^&*_~]/g, '');
    givenAnswer = givenAnswer.replace('-', ' ');

    let answerTokens = answer.split(' ').filter(token => !METAWORDS.includes(token));
    let givenAnswerTokens = givenAnswer.split(' ').filter(token => token.length > 1);

    if (answerTokens.length === 0) {
        return false;
    }

    if (givenAnswerTokens.length === 0) {
        return false;
    }

    for (let i = 0; i < givenAnswerTokens.length; i++) {
        let answerTokenMatches = false;

        // if given answer token matches any word in the answerline
        for (let j = 0; j < answerTokens.length; j++) {
            if (dljs.distance(givenAnswerTokens[i], answerTokens[j]) <= 1) {
                answerTokenMatches = true;
                break;
            }
        }

        if (!answerTokenMatches) {
            return false;
        }
    }

    return true;
}


/**
* @param {JSON} question 
* @param {Array<String>} validCategories
* @param {Array<String>} validSubcategories
* @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
*/
function isValidCategory(question, validCategories, validSubcategories) {
    if (validCategories.length === 0 && validSubcategories.length === 0) return true;

    // check if the subcategory is explicitly included (overrides missing category)
    if (question.subcategory && validSubcategories.includes(question.subcategory)) return true;

    // check if category is excluded (and subcategory is excluded)
    if (!validCategories.includes(question['category'])) return false;

    // at this point, the question category is included in the list of valid categories 
    // check for the case where none of the subcategories are selected but the category is;
    // in which case, the question is valid
    if (!question.subcategory) return true;

    // check to see if the category has no corresponding subcategories
    let index = CATEGORIES.indexOf(question['category']);
    if (!(index in SUBCATEGORIES)) return true;

    // check to see if none of the subcategories of the question are selected
    for (let i = 0; i < SUBCATEGORIES[index].length; i++) {
        if (validSubcategories.includes(SUBCATEGORIES[index][i])) return false;
    }

    // if there are no subcategories selected in the field, then it is valid
    return true;
}


function rangeToArray(string, max = 0) {
    if (string.length === 0) {
        string = `1-${max}`;
    }

    if (string.endsWith('-')) {
        string = string + max;
    }

    let tokens = string.split(",");
    let ranges = [];
    for (let i = 0; i < tokens.length; i++) {
        let range = tokens[i].trim().split("-");
        if (range.length === 1) {
            ranges.push([parseInt(range[0]), parseInt(range[0])]);
        } else {
            ranges.push([parseInt(range[0]), parseInt(range[1])]);
        }
    }

    let array = [];
    for (let i = 0; i < ranges.length; i++) {
        for (let j = ranges[i][0]; j <= ranges[i][1]; j++) {
            array.push(j);
        }
    }

    return array;
}


/**
 * @param {String} answer 
 * @param {String} givenAnswer 
 * @param {Boolean} inPower 
 * @param {Boolean} endOfQuestion 
 */
function scoreTossup(answer, givenAnswer, inPower, endOfQuestion) {
    let isCorrect = checkAnswerCorrectness(answer, givenAnswer);

    return isCorrect ? (inPower ? 15 : 10) : (endOfQuestion ? 0 : -5);
}


module.exports = { CATEGORIES, SUBCATEGORIES, SUBCATEGORIES_FLATTENED, checkAnswerCorrectness, isValidCategory, rangeToArray, scoreTossup };