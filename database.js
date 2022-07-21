const dljs = require('damerau-levenshtein-js');
const fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;

var DATABASE;
var SETS;
var PACKETS;
var QUESTIONS;

const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');

    DATABASE = client.db('qbreader');
    SETS = DATABASE.collection('sets');
    PACKETS = DATABASE.collection('packets');
    QUESTIONS = DATABASE.collection('questions');
});

const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]
const SUBCATEGORIES = [
    ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    ["American History", "Ancient History", "European History", "World History", "Other History"],
    ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"]
]
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

// TODO: currently will not work if it has to check other packets
// create a compound index to do this
function getNextQuestion(setName, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, type = ['tossups']) {
    let set = await SETS.findOne({ name: setName });
    let question = await QUESTIONS.find({
        set: set._id,
        number: { $gt: currentQuestionNumber },
        category: { $in: validCategories },
        subcategory: { $in: validSubcategories },
        type: { $in: type }
    }).sort({ number: 1 }).limit(1);

    return {
        question: question,
        packetNumber: set.indexOf(question.packet) + 1,
    }
}

/**
 * @param {String} setName 
 * @param {Number} packetNumber - 1-indexed packket number
 * @returns {{tosssups: Array<JSON>, bonuses: Array<JSON>}}
 */
async function getPacket(setName, packetNumber) {
    setName = setName.replace(/\s/g, '-');
    return await SETS.findOne({ name: setName }).then(async set => {
        let packetId = set.packets[packetNumber - 1];
        let packet = await PACKETS.findOne({ _id: packetId });
        return {
            tossups: await QUESTIONS.find({ _id: { $in: packet.tossups } }, { sort: { number: 1 } }).toArray(),
            bonuses: await QUESTIONS.find({ _id: { $in: packet.bonuses } }, { sort: { number: 1 } }).toArray()
        }
    }).catch(err => {
        console.log(err);
        return { 'tossups': [], 'bonuses': [] };
    });
}

// WRITE USING MONGODB
async function getNumPackets(setName) {
    return await SETS.findOne({ name: setName }).then(set => {
        return set.packets.length;
    });
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

/**
 * Converts a setTitle string into a setYear and a setName.
 * @param {String} setTitle - The title of the set in the format "setYear-setName".
 * @returns {[Number, String]} `[setYear, setName]`
 */
function parseSetTitle(setTitle) {
    let setYear = parseInt(setTitle.substring(0, 4));
    let setName = setTitle.substring(5);

    return [setYear, setName];
}

module.exports = { checkAnswerCorrectness, parseSetTitle, getNextQuestion, getNumPackets, getPacket };