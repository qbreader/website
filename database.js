const { MongoClient, ObjectId } = require('mongodb');
const { CATEGORIES, SUBCATEGORIES_FLATTENED } = require('./quizbowl');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect();
console.log('connected to mongodb');
const DATABASE = client.db('qbreader');
const SETS = DATABASE.collection('sets');
const QUESTIONS = DATABASE.collection('questions');

const SET_LIST = []; // initialized on server load
SETS.find({}, { projection: { _id: 0, name: 1 }, sort: { name: -1 } }).forEach(set => {
    SET_LIST.push(set.name);
});


/**
 * Gets the next question with a question number greater than `currentQuestionNumber` that satisfies the given conditions.
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {Array<Number>} packetNumbers - an array of packet numbers to search. Each packet number is 1-indexed.
 * @param {Number} currentQuestionNumber - current question number. **Starts at 1.**
 * @param {Array<String>} validCategories 
 * @param {Array<String>} validSubcategories 
 * @param {Array<String>} allowedTypes - Array of allowed types. Default: `['tossups', 'bonuses]` 
 * @param {Boolean} alwaysUseUnformattedAnswer - whether to always use the unformatted answer. Default: `false`
 * @returns {JSON}
 */
async function getNextQuestion(setName, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, allowedTypes = ['tossup'], alwaysUseUnformattedAnswer = false) {
    let set = await SETS.findOne({ name: setName }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return {};
    });

    if (validCategories.length === 0) validCategories = CATEGORIES;
    if (validSubcategories.length === 0) validSubcategories = SUBCATEGORIES_FLATTENED;

    let question = await QUESTIONS.findOne({
        $or: [
            {
                set: set._id,
                category: { $in: validCategories },
                subcategory: { $in: validSubcategories },
                packetNumber: packetNumbers[0],
                questionNumber: { $gt: currentQuestionNumber },
                type: { $in: allowedTypes }
            },
            {
                set: set._id,
                category: { $in: validCategories },
                subcategory: { $in: validSubcategories },
                packetNumber: { $in: packetNumbers.slice(1) },
                type: { $in: allowedTypes }
            },
        ]
    }, {
        sort: { packetNumber: 1, questionNumber: 1 }
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return {};
    });

    if (!alwaysUseUnformattedAnswer && question.hasOwnProperty('answer_formatted')) {
        question.answer = question.answer_formatted;
    }

    return question || {};
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @returns {Number} the number of packets in the set.
 */
async function getNumPackets(setName) {
    return await SETS.findOne({ name: setName }).then(set => {
        return set ? (set.packets.length) : 0;
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return 0;
    });
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {Number} packetNumber - **one-indexed** packet number
 * @param {Array<String>} allowedTypes - Array of allowed types. Default: `['tossups', 'bonuses]`
 * If only one allowed type is specified, only that type will be searched for (increasing query speed).
 * The other type will be returned as an empty array.
 * @returns {{tossups: Array<JSON>, bonuses: Array<JSON>}}
 */
async function getPacket(setName, packetNumber, allowedTypes = ['tossups', 'bonuses'], alwaysUseUnformattedAnswer = false) {
    return await SETS.findOne({ name: setName }).then(async set => {
        let packet = set.packets[packetNumber - 1];
        let result = {};

        if (allowedTypes.includes('tossups')) {
            result['tossups'] = await QUESTIONS.find({ packet: packet._id, type: 'tossup' }).toArray();
        }
        if (allowedTypes.includes('bonuses')) {
            result['bonuses'] = await QUESTIONS.find({ packet: packet._id, type: 'bonus' }).toArray();
        }

        if (!alwaysUseUnformattedAnswer) {
            for (let type in result) {
                for (let question of result[type]) {
                    if (question.hasOwnProperty('answer_formatted')) {
                        question.answer = question.answer_formatted;
                    }
                }
            }
        }

        return result;
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return { 'tossups': [], 'bonuses': [] };
    });
}


/**
 * @param {'tossup' | 'bonus'} type - the type of question to get
 * @param {Array<Number>} difficulties - an array of allowed difficulty levels (1-10). Pass a 0-length array to select any difficulty.
 * @param {Array<String>} allowedCategories - an array of allowed categories. Pass a 0-length array to select any category.
 * @param {Array<String>} allowedSubcategories - an array of allowed subcategories. Pass a 0-length array to select any subcategory.
 * @returns {JSON}
 */
async function getRandomQuestion(type, difficulties, allowedCategories, allowedSubcategories) {
    if (difficulties.length === 0) difficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    if (allowedCategories.length === 0) allowedCategories = CATEGORIES;
    if (allowedSubcategories.length === 0) allowedSubcategories = SUBCATEGORIES_FLATTENED;

    let question = await QUESTIONS.aggregate([
        { $match: { type: type, difficulty: { $in: difficulties }, category: { $in: allowedCategories }, subcategory: { $in: allowedSubcategories } } },
        { $sample: { size: 1 } }
    ]).toArray();

    if (question.length === 0) {
        return {};
    }

    question = question[0];
    let set = await SETS.findOne({ _id: question.set });
    question.setName = set.name;
    return question;
}


/**
 * @returns {Array<String>} an array of all the set names.
 */
function getSetList() {
    return SET_LIST;
}


module.exports = { getNextQuestion, getNumPackets, getPacket, getRandomQuestion, getSetList };