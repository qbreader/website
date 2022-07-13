const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]
const SUBCATEGORIES = [
    ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    ["American History", "Ancient History", "European History", "World History", "Other History"],
    ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"]
]
const METAWORDS = ["the", "like", "descriptions", "description", "of", "do", "not", "as", "accept", "or", "other", "prompt", "on", "except", "before", "after", "is", "read", "stated", "mentioned", "at", "any", "time", "don't", "more", "specific", "etc", "eg", "answers", "word", "forms"];


/**
 * Source: https://www.30secondsofcode.org/js/s/levenshtein-distance
 * @param {String} s 
 * @param {String} t 
 * @returns 
 */
function levenshteinDistance(s, t) {
    if (!s.length) return t.length;
    if (!t.length) return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
        arr[i] = [i];
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] =
                i === 0
                    ? j
                    : Math.min(
                        arr[i - 1][j] + 1,
                        arr[i][j - 1] + 1,
                        arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
                    );
        }
    }
    return arr[t.length][s.length];
};

function checkAnswerCorrectness(answer, givenAnswer) {
    answer = answer.toLowerCase().trim();
    givenAnswer = givenAnswer.toLowerCase().trim();

    if (givenAnswer.length === 0) {
        return false;
    }

    let answerTokens = answer.split(' ');
    let givenAnswerTokens = givenAnswer.split(' ');

    for (let i = 0; i < givenAnswerTokens.length; i++) {
        if (givenAnswerTokens[i].length <= 1) return false;
        for (let j = 0; j < answerTokens.length; j++) {
            if (METAWORDS.includes(answerTokens[j])) continue;
            if (answerTokens[j].length === 1) continue;
            if (levenshteinDistance(givenAnswerTokens[i], answerTokens[j]) <= 2) {
                return true;
            }
        }
    }

    return false;
}

function parseSetTitle(setTitle) {
    let year = parseInt(setTitle.substring(0, 4));
    let name = setTitle.substring(5);

    return [year, name];
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

function getNextQuestion(year, name, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, mode = 'tossups') {
    let packetNumber = packetNumbers[0];
    let questions = getPacket(year, name, packetNumber)[mode];
    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) {
                return {};  // alert the user if there are no more packets
            }
            packetNumbers.shift();
            packetNumber = packetNumbers[0];
            questions = getPacket(year, name, packetNumber)[mode];
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber], validCategories, validSubcategories));

    return {
        'question': questions[currentQuestionNumber],
        'packetNumber': packetNumber,
        'packetNumbers': packetNumbers,
        'currentQuestionNumber': currentQuestionNumber
    }
}

function getPacket(year, name, packetNumber) {
    name = name.toLowerCase();
    name = name.replace(/\s/g, '_');
    let directory = `./packets/${year}-${name}/${packetNumber}.json`;
    try {
        let jsonfile = require(directory);
        return jsonfile;
    } catch (error) {
        console.log('ERROR: Could not find packet located at ' + directory);
        return {};
    }
}

module.exports = { checkAnswerCorrectness, parseSetTitle, getNextQuestion, getPacket };