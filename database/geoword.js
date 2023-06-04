import { getUserId, getUsername } from './users.js';

import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const geoword = client.db('geoword');
const answers = geoword.collection('answers');
const buzzes = geoword.collection('buzzes');

/**
 *
 * @param {String} packetName
 * @param {Number} questionNumber
 * @returns
 */
async function getAnswer(packetName, questionNumber) {
    const result = await answers.findOne({ packetName, questionNumber });

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

    return result[0];
}

async function getQuestionCount(packetName) {
    return await answers.countDocuments({ packetName });
}

/**
 * @param {Object} params
 * @param {String} params.packetName
 * @param {ObjectId} user_id
 */
async function getUserStats({ packetName, user_id }) {
    const buzzArray = await buzzes.aggregate([
        { $match: { packetName, user_id } },
        { $sort: { questionNumber: 1 } },
        { $lookup: {
            from: 'answers',
            let: { questionNumber: '$questionNumber', packetName },
            pipeline: [
                { $match: { $expr: { $and: [
                    { $eq: ['$questionNumber', '$$questionNumber'] },
                    { $eq: ['$packetName', '$$packetName'] },
                ] } } },
            ],
            as: 'answer',
        } },
        { $unwind: '$answer' },
        { $project: {
            _id: 0,
            celerity: 1,
            pendingProtest: 1,
            points: 1,
            questionNumber: 1,
            answer: '$answer.answer',
            formatted_answer: '$answer.formatted_answer',
            givenAnswer: 1,
        } }
    ]).toArray();

    const leaderboard = await buzzes.aggregate([
        { $match: { packetName } },
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
        question.rank = await buzzes.countDocuments({
            packetName,
            questionNumber: question._id,
            celerity: { $gte: buzzArray[index].celerity },
            points: { $gte: buzzArray[index].points },
        });
    }

    return { buzzArray, leaderboard };
}

async function recordProtest({ packetName, questionNumber, username }) {
    const user_id = await getUserId(username);
    return await buzzes.updateOne(
        { user_id, packetName, questionNumber },
        { $set: { pendingProtest: true } },
    );
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
    const buzz = await buzzes.findOne({ user_id, packetName, questionNumber });

    if (buzz) {
        return false;
    }

    buzzes.insertOne({ celerity, givenAnswer, points, packetName, questionNumber, user_id });

    return true;
}

export {
    getAnswer,
    getBuzzCount,
    getProgress,
    getQuestionCount,
    getUserStats,
    recordProtest,
    recordBuzz,
};
