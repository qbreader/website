import { getUsername, isAdminById } from './users.js';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const geoword = client.db('geoword');
const audio = geoword.collection('audio');
const buzzes = geoword.collection('buzzes');
const divisionChoices = geoword.collection('division-choices');
const packets = geoword.collection('packets');
const payments = geoword.collection('payments');
const tossups = geoword.collection('tossups');

/**
 * @param {String} packetName
 * @param {String} username
 * @returns {Promise<Boolean>} true if the user has paid for the packet, if the packet is free, or if the user is an admin.
 */
async function checkPayment(packetName, user_id) {
    const packet = await packets.findOne({ name: packetName });

    if (!packet) {
        return false;
    } else if (packet.costInCents === 0) {
        return true;
    }

    if (await isAdminById(user_id)) {
        return true;
    }

    const result = await payments.findOne({ 'packet.name': packetName, user_id });
    return !!result;
}

async function getAdminStats(packetName, division) {
    const stats = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division, active: true } },
        { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
        { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined ] } } },
        { $sort: { correctCelerity: -1 } },
        { $group: {
            _id: '$questionNumber',
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
            let: { questionNumber: '$questionNumber', packet: { name: packetName }, division },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packet.name', '$$packet.name'] },
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
    const result = await tossups.findOne({ 'packet.name': packetName, division, questionNumber });

    if (!result) {
        return '';
    } else {
        const { answer, formatted_answer } = result;
        return formatted_answer ?? answer;
    }
}

/**
 *
 * @param {String} packetName
 * @param {String} division
 * @param {Integer} questionNumber
 * @returns {Promise<Buffer>}
 */
async function getAudio(packetName, division, questionNumber) {
    const tossup = await tossups.findOne({ 'packet.name': packetName, division, questionNumber });
    if (!tossup) {
        return null;
    }

    const audioFile = await audio.findOne({ _id: tossup.audio_id });
    if (!audioFile) {
        return null;
    }

    return audioFile.audio.buffer;
}

/**
 *
 * @param {String} packetName
 * @param {String} division
 * @param {ObjectId} user_id
 * @param {Boolean} protests - whether to include protests (default: false)
 */
async function getBuzzes(packetName, division, user_id, protests=false) {
    const projection = {
        _id: 0,
        celerity: 1,
        points: 1,
        questionNumber: 1,
        answer: '$tossup.answer',
        formatted_answer: '$tossup.formatted_answer',
        givenAnswer: 1,
        prompts: 1,
    };

    if (protests) {
        projection.pendingProtest = 1;
        projection.decision = 1;
        projection.reason = 1;
    }

    return await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division, user_id } },
        { $sort: { questionNumber: 1 } },
        { $lookup: {
            from: 'tossups',
            let: { questionNumber: '$questionNumber', packet: { name: packetName }, division },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packet.name', '$$packet.name'] },
                    { $eq: ['$division', '$$division'] },
                ] } } },
            ],
            as: 'tossup',
        } },
        { $unwind: '$tossup' },
        { $project: projection },
    ]).toArray();
}

async function getBuzzCount(packetName, user_id) {
    return await buzzes.countDocuments({ 'packet.name': packetName, user_id });
}

/**
 * @param {String} packetName
 * @returns {Integer} the cost to play the packet, in cents (USD)
 */
async function getCost(packetName) {
    const packet = await packets.findOne({ name: packetName });
    return packet?.costInCents ?? 0;
}

async function getDivisionChoice(packetName, user_id) {
    const result = await divisionChoices.findOne({ 'packet.name': packetName, user_id });
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

async function getLeaderboard(packetName, division, includeInactive=false, limit=100) {
    const aggregation = [
        { $match: { 'packet.name': packetName, division } },
        { $group: {
            _id: '$user_id',
            active: { $first: '$active' },
            numberCorrect: { $sum: { $cond: [ { $gt: ['$points', 0] }, 1, 0 ] } },
            points: { $sum: '$points' },
            pointsPerTossup: { $avg: '$points' },
            averageCorrectCelerity: { $avg: { $cond: [ { $gt: ['$points', 0] }, '$celerity', undefined ] } },
        } },
        { $sort: { points: -1, numberCorrect: -1 } },
        { $limit: limit },
    ];

    if (!includeInactive) {
        aggregation[0].$match.active = true;
    }

    const result = await buzzes.aggregate(aggregation).toArray();

    for (const index in result) {
        const user_id = result[index]._id;
        result[index].username = await getUsername(user_id);
    }

    return result;
}

async function getPacket(packetName, division) {
    return await tossups.find(
        { 'packet.name': packetName, division },
        { sort: { questionNumber: 1 } },
    ).toArray();
}

async function getPacketList() {
    return await packets.find(
        { test: { $ne: true } },
        {
            sort: { order: 1 },
            projection: { name: 1, divisions: 1, _id: 0 },
        },
    ).toArray();
}

/**
 *
 * @param {*} packetName
 * @returns null if the packet doesn't exist, true if it is accessible to the public, and false if only admins can see it
 */
async function getPacketStatus(packetName) {
    const packet = await packets.findOne({ name: packetName });
    if (!packet) {
        return null;
    }

    return packet.test !== true;
}

async function getPlayerList(packetName, division) {
    const result = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division } },
        { $group: { _id: '$user_id' } },
    ]).toArray();

    for (const index in result) {
        const user_id = result[index]._id;
        result[index].username = await getUsername(user_id);
    }

    result.sort((a, b) => a.username.localeCompare(b.username));

    return result;
}

async function getProgress(packetName, user_id) {
    const result = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, user_id } },
        { $group: {
            _id: null,
            numberCorrect: { $sum: { $cond: [ { $gt: ['$points', 0] }, 1, 0 ] } },
            points: { $sum: '$points' },
            totalCorrectCelerity: { $sum: { $cond: [ { $gt: ['$points', 0] }, '$celerity', 0 ] } },
            tossupsHeard: { $sum: 1 },
        } },
    ]).toArray();

    result[0] = result[0] || {};
    result[0].division = await getDivisionChoice(packetName, user_id);
    return result[0];
}

async function getProtests(packetName, division) {
    const protests = await buzzes.find(
        { 'packet.name': packetName, division, pendingProtest: { $exists: true } },
        { sort: { questionNumber: 1 } },
    ).toArray();

    const packet = await tossups.find(
        { 'packet.name': packetName, division },
        { sort: { questionNumber: 1 } },
    ).toArray();

    for (const index in protests) {
        const user_id = protests[index].user_id;
        protests[index].username = await getUsername(user_id);
    }

    return { protests, packet };
}


async function getQuestionCount(packetName, division) {
    if (division === undefined) {
        const packet = await packets.findOne({ name: packetName });
        const count = await tossups.countDocuments({ 'packet.name': packetName });
        return Math.round(count / packet.divisions.length);
    }

    return await tossups.countDocuments({ packetName, division });
}

/**
 * @param {String} packetName
 * @param {ObjectId} user_id
 */
async function getUserStats(packetName, user_id) {
    const division = await getDivisionChoice(packetName, user_id);
    const buzzArray = await getBuzzes(packetName, division, user_id, true);

    const leaderboard = await buzzes.aggregate([
        { $match: { 'packet.name': packetName, division, active: true } },
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

        if (question) {
            question.bestUsername = await getUsername(question.bestUserId);
            question.rank = 1 + await buzzes.countDocuments({
                'packet.name': packetName,
                questionNumber: question._id,
                division,
                active: true,
                $or: [
                    { $and: [
                        { celerity: { $gt: buzzArray[index].celerity } },
                        { points: { $eq: buzzArray[index].points } },
                    ] },
                    { points: { $gt: buzzArray[index].points } },
                ],
            });
        } else {
            leaderboard[index] = {
                _id: index,
                bestCelerity: 0,
                bestUsername: '',
                averageCorrectCelerity: 0,
                averagePoints: 0,
                rank: 1,
            };
        }
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
 * @param {String[]} params.prompts - whether or not the buzz is a prompt
 */
async function recordBuzz({ celerity, givenAnswer, packetName, points, prompts, questionNumber, user_id }) {
    const [division, packet, admin] = await Promise.all([
        getDivisionChoice(packetName, user_id),
        packets.findOne({ name: packetName }),
        isAdminById(user_id),
    ]);

    const insertDocument = {
        active: packet.active && !admin,
        celerity, division, givenAnswer, points,
        packet: {
            _id: packet._id,
            name: packet.name,
        },
        questionNumber,
        user_id,
    };

    if (prompts && typeof prompts === 'object' && prompts.length > 0) {
        insertDocument.prompts = prompts;
    }

    return await buzzes.insertOne(insertDocument);
}

async function recordDivision(packetName, division, user_id) {
    const packet = await packets.findOne({ name: packetName });
    return await divisionChoices.replaceOne(
        { user_id, 'packet.name': packetName },
        { user_id, packet: { _id: packet._id, name: packetName }, division },
        { upsert: true },
    );
}

async function recordPayment(packetName, user_id) {
    const packet = await packets.findOne({ name: packetName });
    return await payments.replaceOne(
        { user_id, 'packet.name': packetName },
        { user_id, packet: { _id: packet._id, name: packetName }, createdAt: new Date() },
        { upsert: true },
    );
}

async function recordProtest(packetName, questionNumber, user_id) {
    return await buzzes.updateOne(
        { 'packet.name': packetName, questionNumber, user_id },
        { $set: { pendingProtest: true } },
    );
}

async function resolveProtest(buzz_id, decision, reason) {
    const updateDocument = { pendingProtest: false, decision, reason };

    if (decision === 'accept') {
        const buzz = await buzzes.findOne({ _id: buzz_id });
        updateDocument.points = 10 + Math.round(10 * buzz.celerity);
    }

    return await buzzes.updateOne(
        { _id: buzz_id },
        { $set: updateDocument },
    );
}

export {
    checkPayment,
    getAdminStats,
    getAnswer,
    getAudio,
    getBuzzCount,
    getBuzzes,
    getCost,
    getDivisionChoice,
    getDivisions,
    getLeaderboard,
    getPacket,
    getPacketList,
    getPacketStatus,
    getPlayerList,
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
