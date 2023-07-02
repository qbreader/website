import { getUserId, getUsername, isAdmin } from './users.js';

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
const payments = geoword.collection('payments');
const tossups = geoword.collection('tossups');

/**
 * Returns true if the user has paid for the packet,
 * or if the packet is free, or if the user is an admin.
 * @param {*} param0
 * @returns {Promise<Boolean>}
 */
async function checkPayment({ packetName, username }) {
    const packet = await packets.findOne({ name: packetName });

    if (!packet) {
        return false;
    } else if (packet.costInCents === 0) {
        return true;
    }

    const [user_id, admin] = await Promise.all([getUserId(username), isAdmin(username)]);

    if (admin) {
        return true;
    }

    const result = await payments.findOne({ packetName, user_id });
    return !!result;
}

async function getAdminStats(packetName, division) {
    const stats = await buzzes.aggregate([
        { $match: { packetName, division } },
        { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
        { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined ] } } },
        { $sort: { correctCelerity: -1 } },
        { $group: {
            _id: '$questionNumber',
            activeProtests: { $sum: { $cond: ['$pendingProtest', 1, 0] } },
            averageCorrectCelerity: { $avg: '$correctCelerity' },
            averagePoints: { $avg: '$points' },
            bestCelerity: { $max: '$correctCelerity' },
            bestUserId: { $first: '$user_id' },
            numberCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            questionNumber: { $first: '$questionNumber' },
            timesHeard: { $sum: 1 },
        } },
        { $sort: { _id: 1 } },
        { $lookup: {
            from: 'tossups',
            let: { questionNumber: '$questionNumber', packetName, division },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packetName', '$$packetName'] },
                    { $eq: ['$division', '$$division'] },
                ] } } },
            ],
            as: 'tossup',
        } },
        { $unwind: '$tossup' },
    ]).toArray();

    for (const index in stats) {
        const question = stats[index];
        question.bestUsername = await getUsername(question.bestUserId);
    }

    return stats;
}


/**
 *
 * @param {String} packetName
 * @param {Number} questionNumber
 * @returns
 */
async function getAnswer(packetName, division, questionNumber) {
    const result = await tossups.findOne({ packetName, division, questionNumber });

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

/**
 *
 * @param {*} packetName
 * @returns {Integer} the cost to play the packet, in cents (USD)
 */
async function getCost(packetName) {
    const packet = await packets.findOne({ name: packetName });
    return packet?.costInCents;
}

async function getDivisionChoice(packetName, username) {
    const user_id = await getUserId(username);
    return await getDivisionChoiceById(packetName, user_id);
}

async function getDivisionChoiceById(packetName, user_id) {
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

async function getLeaderboard(packetName, division, limit=100) {
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
    const list = await packets.find({ test: { $exists: false } }, {
        sort: { order: 1 },
        projection: { name: 1, divisions: 1, _id: 0 },
    }).toArray();

    return list;
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
    result[0].division = await getDivisionChoiceById(packetName, user_id);
    return result[0];
}

async function getProtests(packetName, division) {
    const protests = await buzzes.find(
        { packetName, division, pendingProtest: { $exists: true } },
        { sort: { questionNumber: 1 } },
    ).toArray();

    const packet = await tossups.find(
        { packetName, division },
        { sort: { questionNumber: 1 } },
    ).toArray();

    for (const index in protests) {
        const user_id = protests[index].user_id;
        protests[index].username = await getUsername(user_id);
    }

    return { protests, packet };
}

async function getQuestionCount(packetName, division) {
    return await tossups.countDocuments({ packetName, division });
}

/**
 * @param {Object} params
 * @param {String} params.packetName
 * @param {ObjectId} user_id
 */
async function getUserStats({ packetName, user_id }) {
    const division = await getDivisionChoiceById(packetName, user_id);

    const buzzArray = await buzzes.aggregate([
        { $match: { packetName, user_id } },
        { $sort: { questionNumber: 1 } },
        { $lookup: {
            from: 'tossups',
            let: { questionNumber: '$questionNumber', packetName, division },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packetName', '$$packetName'] },
                    { $eq: ['$division', '$$division'] },
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
            decision: 1,
            reason: 1,
        } },
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
            division,
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
    const division = await getDivisionChoiceById(packetName, user_id);

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

async function recordPayment({ packetName, user_id }) {
    return payments.replaceOne(
        { user_id, packetName },
        { user_id, packetName, createdAt: new Date() },
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

async function resolveProtest({ id, decision, reason }) {
    const updateDocument = { pendingProtest: false, decision, reason };

    if (decision === 'accept') {
        const buzz = await buzzes.findOne({ _id: id });
        updateDocument.points = 10 + Math.round(10 * buzz.celerity);
    }

    const result = await buzzes.updateOne(
        { _id: id },
        { $set: updateDocument },
    );

    return result;
}

export {
    checkPayment,
    getAdminStats,
    getAnswer,
    getBuzzCount,
    getCost,
    getDivisionChoice,
    getDivisions,
    getLeaderboard,
    getPacketList,
    getProgress,
    getProtests,
    getQuestionCount,
    getUserStats,
    recordBuzz,
    recordDivision,
    recordPayment,
    recordProtest,
    resolveProtest,
};
