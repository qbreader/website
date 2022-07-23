const { MongoClient, ObjectId } = require('mongodb');
const { CATEGORIES } = require('./quizbowl');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const SET_LIST = []; // initialized on server load

var DATABASE;
var SETS;
var QUESTIONS;

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    DATABASE = client.db('qbreader');
    SETS = DATABASE.collection('sets');
    QUESTIONS = DATABASE.collection('questions');

    await SETS.find({}, { projection: { _id: 0, name: 1 }, sort: { name: -1 } }).forEach(set => {
        SET_LIST.push(set.name);
    });
});


/**
 * @param {String} setName - the name of the set (e.g. "2021 PACE").
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


async function getNextQuestion(setName, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, type = ['tossup']) {
    let set = await SETS.findOne({ name: setName }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return {};
    });

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
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return {};
    });

    return question || {};
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
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return { 'tossups': [], 'bonuses': [] };
    });
}


function getSetList() {
    return SET_LIST;
}


module.exports = { getNextQuestion, getNumPackets, getPacket, getSetList };