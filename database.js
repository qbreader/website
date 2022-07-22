const dljs = require('damerau-levenshtein-js');
const fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;

var DATABASE;
var SETS;
var QUESTIONS;

const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    DATABASE = client.db('qbreader');
    SETS = DATABASE.collection('sets');
    QUESTIONS = DATABASE.collection('questions');

    await SETS.find({}, { projection: { _id: 0, name: 1 }, sort: { name: -1 } }).forEach(doc => {
        let name = doc.name;
        name = name.replace(/-/g, ' ');
        SET_LIST.push(name);
    });
});

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
const SET_LIST = []; // initialized on server load
const METAWORDS = ["the", "like", "descriptions", "description", "of", "do", "not", "as", "accept", "or", "other", "prompt", "on", "except", "before", "after", "is", "read", "stated", "mentioned", "at", "any", "time", "don't", "more", "specific", "etc", "eg", "answers", "word", "forms"];


function checkAnswerCorrectness(answer, givenAnswer) {
    answer = answer.toLowerCase().trim();
    givenAnswer = givenAnswer.toLowerCase().trim();

    if (answer.length === 0 || givenAnswer.length === 0) {
        return false;
    }

    let answerTokens = answer.split(' ');
    let givenAnswerTokens = givenAnswer.split(' ');

    for (let i = 0; i < givenAnswerTokens.length; i++) {
        if (givenAnswerTokens[i].length <= 2) return false;

        // if given answer token matches any word in the answerline
        for (let j = 0; j < answerTokens.length; j++) {
            if (METAWORDS.includes(answerTokens[j])) {
                console.log(answerTokens[j]);
                continue;
            }
            if (answerTokens[j].length === 1) continue;
            if (dljs.distance(givenAnswerTokens[i], answerTokens[j]) <= 1) {
                return true;
            }
        }
    }

    return false;
}

async function getNextQuestion(setName, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, type = ['tossup']) {
    setName = setName.replace(/\s/g, '-');
    let set = await SETS.findOne({ name: setName });
    if (validCategories.length === 0) {
        validCategories = CATEGORIES;
    }

    let question = await QUESTIONS.findOne({
        $or: [
            {
                set: set._id,
                category: { $in: validCategories },
                // subcategory: { $in: validSubcategories },
                packetNumber: packetNumbers[0],
                questionNumber: { $gt: currentQuestionNumber },
                type: { $in: type }
            },
            {
                set: set._id,
                category: { $in: validCategories },
                // subcategory: { $in: validSubcategories },
                packetNumber: { $in: packetNumbers.slice(1) },
                type: { $in: type }
            },
        ]
    }, {
        sort: { packetNumber: 1, questionNumber: 1 }
    });

    return question || {};
}

/**
 * @param {String} setName - the name of the set (e.g. "2021 PACE").
 * @returns {Number} the number of packets in the set.
 */
async function getNumPackets(setName) {
    setName = setName.replace(/\s/g, '-');
    return await SETS.findOne({ name: setName }).then(set => {
        if (set) {
            return set.packets.length;
        } else {
            return 0;
        }
    });
}

/**
 * @param {String} setName - the name of the set (e.g. "2021 PACE").
 * @param {Number} packetNumber - **one-indexed** packet number
 * @param {Array<String>} allowedTypes Array of allowed types. Default: `['tossups', 'bonuses]`
 * If only one allowed type is specified, only that type will be searched for (increasing query speed).
 * The other type will be returned as an empty array.
 * @returns {{tossups: Array<JSON>, bonuses: Array<JSON>}}
 */
async function getPacket(setName, packetNumber, allowedTypes = ['tossups', 'bonuses']) {
    setName = setName.replace(/\s/g, '-');
    return await SETS.findOne({ name: setName }).then(async set => {
        let packet = set.packets[packetNumber - 1];
        let result = {};

        if (allowedTypes.includes('tossups')) {
            result['tossups'] = await QUESTIONS.find({ _id: { $in: packet.tossups } }).toArray();
        }
        if (allowedTypes.includes('bonuses')) {
            result['bonuses'] = await QUESTIONS.find({ _id: { $in: packet.bonuses } }).toArray();
        }

        return result;
    }).catch(err => {
        console.log(err);
        return { 'tossups': [], 'bonuses': [] };
    });
}

function getSetList() {
    return SET_LIST;
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

module.exports = { checkAnswerCorrectness, getNextQuestion, getNumPackets, getPacket, getSetList };