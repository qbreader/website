import { getUserId, getUsername } from './users.js';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const geoword = client.db('geoword');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const tossups = geoword.collection('tossups');

/**
 *
 * @param {String} packetName
 * @param {Number} questionNumber
 * @returns
 */
async function getAnswer(packetName, questionNumber) {
    const result = await tossups.findOne({ packetName, questionNumber });

    if (!result) {
        return '';
    } else {
        const { answer, formatted_answer } = result;
        return formatted_answer ?? answer;
    }
}

async function getBuzzCount(packetName, username) {
    const user_id = await getUserId(username);
    return await buzzes.countDocuments({ packetName, user_id });
}

async function getDivisionChoice(packetName, username) {
    const user_id = await getUserId(username);
    return await getDivisionById(packetName, user_id);
}

async function getDivisionById(packetName, user_id) {
    const result = await divisionChoices.findOne({ packetName, user_id });
    return result?.division;
}

/**
 *
 * @param {String} packetName
 * @returns {Promise<Array<String>>} divisions
 */
async function getDivisions(packetName) {
    const packet = await packets.findOne({ name: packetName });
    return packet?.divisions;
}

async function getLeaderboard(packetName, division, limit=20) {
    const result = await buzzes.aggregate([
        { $match: { packetName, division } },
        { $group: {
            _id: '$user_id',
            numberCorrect: { $sum: { $cond: [ { $gt: ['$points', 0] }, 1, 0 ] } },
            points: { $sum: '$points' },
            pointsPerTossup: { $avg: '$points' },
            averageCorrectCelerity: { $avg: { $cond: [ { $gt: ['$points', 0] }, '$celerity', undefined ] } },
        } },
        { $sort: { points: -1, numberCorrect: -1 } },
        { $limit: limit },
    ]).toArray();

    for (const index in result) {
        const user_id = result[index]._id;
        result[index].username = await getUsername(user_id);
    }

    return result;
}

async function getPacketList() {
    const list = await packets.find({}, { sort: { order: 1 } }).toArray();
    return list.map(packet => packet.name);
}

async function getProgress(packetName, username) {
    const user_id = await getUserId(username);
    const result = await buzzes.aggregate([
        { $match: { packetName, user_id } },
        { $group: {
            _id: null,
            numberCorrect: { $sum: { $cond: [ { $gt: ['$points', 0] }, 1, 0 ] } },
            points: { $sum: '$points' },
            totalCorrectCelerity: { $sum: { $cond: [ { $gt: ['$points', 0] }, '$celerity', 0 ] } },
            tossupsHeard: { $sum: 1 },
        } },
    ]).toArray();

    result[0] = result[0] || {};
    result[0].division = await getDivisionById(packetName, user_id);
    return result[0];
}

async function getQuestionCount(packetName) {
    return await tossups.countDocuments({ packetName });
}

/**
 * @param {Object} params
 * @param {String} params.packetName
 * @param {ObjectId} user_id
 */
async function getUserStats({ packetName, user_id }) {
    const division = await getDivisionById(packetName, user_id);

    const buzzArray = await buzzes.aggregate([
        { $match: { packetName, user_id } },
        { $sort: { questionNumber: 1 } },
        { $lookup: {
            from: 'tossups',
            let: { questionNumber: '$questionNumber', packetName },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packetName', '$$packetName'] },
                ] } } },
            ],
            as: 'tossup',
        } },
        { $unwind: '$tossup' },
        { $project: {
            _id: 0,
            celerity: 1,
            pendingProtest: 1,
            points: 1,
            questionNumber: 1,
            answer: '$tossup.answer',
            formatted_answer: '$tossup.formatted_answer',
            givenAnswer: 1,
        } }
    ]).toArray();

    const leaderboard = await buzzes.aggregate([
        { $match: { packetName, division } },
        { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
        { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined ] } } },
        { $sort: { correctCelerity: -1 } },
        { $group: {
            _id: '$questionNumber',
            bestCelerity: { $max: '$correctCelerity' },
            averageCorrectCelerity: { $avg: '$correctCelerity' },
            averagePoints: { $avg: '$points' },
            bestUserId: { $first: '$user_id' },
        } },
        { $sort: { _id: 1 } },
    ]).toArray();

    for (const index in buzzArray) {
        const question = leaderboard[index];
        question.bestUsername = await getUsername(question.bestUserId);
        question.rank = 1 + await buzzes.countDocuments({
            packetName,
            questionNumber: question._id,
            $or: [
                { celerity: { $gt: buzzArray[index].celerity } },
                { points: { $gt: buzzArray[index].points } },
            ],
        });
    }

    return { buzzArray, division, leaderboard };
}


/**
 * @param {Object} params
 * @param {Decimal} params.celerity
 * @param {String} params.givenAnswer
 * @param {Boolean} params.isCorrect
 * @param {String} params.packetName
 * @param {Number} params.questionNumber
 * @param {ObjectId} params.user_id
 */
async function recordBuzz({ celerity, givenAnswer, points, packetName, questionNumber, user_id }) {
    const division = await getDivisionById(packetName, user_id);

    await buzzes.replaceOne(
        { user_id, packetName, questionNumber },
        { celerity, division, givenAnswer, points, packetName, questionNumber, user_id },
        { upsert: true },
    );

    return true;
}

async function recordDivision({ packetName, username, division }) {
    const user_id = await getUserId(username);
    return divisionChoices.replaceOne(
        { user_id, packetName },
        { user_id, packetName, division },
        { upsert: true },
    );
}

async function recordProtest({ packetName, questionNumber, username }) {
    const user_id = await getUserId(username);
    return await buzzes.updateOne(
        { user_id, packetName, questionNumber },
        { $set: { pendingProtest: true } },
    );
}

export {
    getAnswer,
    getBuzzCount,
    getDivisionChoice,
    getDivisions,
    getLeaderboard,
    getPacketList,
    getProgress,
    getQuestionCount,
    getUserStats,
    recordBuzz,
    recordDivision,
    recordProtest,
};
