import { getTossupById, getBonusById, getSetId } from './questions.js';

import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const database = client.db('account-info');
const users = database.collection('users');
const tossupData = database.collection('tossup-data');
const bonusData = database.collection('bonus-data');


const username_to_id = {};
const id_to_username = {};


async function createUser(username, password, email) {
    return await users.insertOne({
        username,
        password,
        email,
        verifiedEmail: false,
    });
}


async function generateMatchDocument({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    const matchDocument = { user_id: user_id };

    if (!includeMultiplayer && !includeSingleplayer) {
        return { _id: null };
    }

    if (!includeSingleplayer) {
        matchDocument.multiplayer = true;
    }

    if (!includeMultiplayer) {
        // if multiplayer field is missing, then it is singleplayer
        matchDocument.multiplayer = { $ne: true };
    }

    if (difficulties) {
        matchDocument.difficulty = { $in: difficulties };
    }

    if (setName) {
        matchDocument.set_id = await getSetId(setName);
    }

    if (startDate) {
        matchDocument.createdAt = { $gte: startDate };
    }

    if (endDate) {
        if (!matchDocument.createdAt) {
            matchDocument.createdAt = {};
        }

        matchDocument.createdAt.$lt = new Date(endDate.getTime() + 1000 * 60 * 60 * 24);
    }

    return matchDocument;
}


async function getBestBuzz({ username, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    const user_id = await getUserId(username);
    const matchDocument = await generateMatchDocument({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
    matchDocument.isCorrect = true;

    const data = await tossupData.findOne(
        matchDocument,
        { sort: { celerity: -1 } },
    );

    if (!data)
        return null;

    data.tossup = await getTossupById(data.tossup_id);
    return data;
}


async function getCategoryStats({ username, questionType, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    const user_id = await getUserId(username);
    return await getStatsHelper({ user_id, questionType, groupByField: 'category', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}


async function getSubcategoryStats({ username, questionType, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } ) {
    const user_id = await getUserId(username);
    return await getStatsHelper({ user_id, questionType, groupByField: 'subcategory', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}


/**
 * Get the stats for a single bonus.
 * @param {ObjectId} bonus_id the bonus id
 * @returns {Promise<Document>} the bonus stats
 */
async function getSingleBonusStats(bonus_id) {
    const bonus = await getBonusById(bonus_id);

    if (!bonus) {
        return null;
    }

    const result = await bonusData.aggregate([
        { $match: { bonus_id, pointsPerPart: { $size: bonus.parts.length } } },
        { $addFields: { pointValue: { $sum: '$pointsPerPart' } } },
        { $addFields: {
            convertedPart1: { $ne: [ { $arrayElemAt: [ '$pointsPerPart', 0 ] }, 0] },
            convertedPart2: { $ne: [ { $arrayElemAt: [ '$pointsPerPart', 1 ] }, 0] },
            convertedPart3: { $ne: [ { $arrayElemAt: [ '$pointsPerPart', 2 ] }, 0] },
            is30: { $eq: ['$pointValue', 30] },
            is20: { $eq: ['$pointValue', 20] },
            is10: { $eq: ['$pointValue', 10] },
            is0:  { $eq: ['$pointValue',  0] },
        } },
        { $group: {
            _id: bonus_id,
            count: { $sum: 1 },
            '30s': { $sum: { $cond: ['$is30', 1, 0] } },
            '20s': { $sum: { $cond: ['$is20', 1, 0] } },
            '10s': { $sum: { $cond: ['$is10', 1, 0] } },
            '0s':  { $sum: { $cond: ['$is0',  1, 0] } },
            part1: { $avg: { $cond: ['$convertedPart1', 1, 0] } },
            part2: { $avg: { $cond: ['$convertedPart2', 1, 0] } },
            part3: { $avg: { $cond: ['$convertedPart3', 1, 0] } },
            totalPoints: { $sum: '$pointValue' },
            ppb: { $avg: '$pointValue' },
        } },
    ]).toArray();

    return result[0];
}


/**
 * Get the stats for a single tossup.
 * @param {ObjectId} tossup_id the tossup id
 * @returns {Promise<Document>} the tossup stats
 */
async function getSingleTossupStats(tossup_id) {
    const result = await tossupData.aggregate([
        { $match: { tossup_id } },
        { $addFields: {
            is15: { $gt: ['$pointValue', 10] },
            is10: { $eq: ['$pointValue', 10] },
            isNeg5: { $lt: ['$pointValue', 0] },
        } },
        { $group: {
            numCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            _id: tossup_id,
            count: { $sum: 1 },
            '15s': { $sum: { $cond: ['$is15', 1, 0] } },
            '10s': { $sum: { $cond: ['$is10', 1, 0] } },
            '-5s': { $sum: { $cond: ['$isNeg5', 1, 0] } },
            totalCelerity: { $sum: '$celerity' },
            totalCorrectCelerity: { $sum: { $cond: ['$isCorrect', '$celerity', 0] } },
            totalPoints: { $sum: '$pointValue' },
            pptu: { $avg: '$pointValue' },
        } },
    ]).toArray();

    return result[0];
}


/**
 * @param {Object} params
 * @param {ObjectId} params.user_id
 * @param {'tossup' | 'bonus'} params.questionType
 * @param {'category' | 'subcategory'} params.groupByField
 * @param {Number[]} params.difficulties
 * @param {String} params.setName
 * @param {Boolean} params.includeMultiplayer
 * @param {Boolean} params.includeSingleplayer
 * @param {Date} params.startDate
 * @param {Date} params.endDate
 * @returns
 */
async function getStatsHelper({ user_id, questionType, groupByField, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    groupByField = '$' + groupByField;

    const matchDocument = await generateMatchDocument({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });

    switch (questionType) {
    case 'tossup':
        return await tossupData.aggregate([
            { $match: matchDocument },
            { $addFields: {
                is15: { $gt: ['$pointValue', 10] },
                is10: { $eq: ['$pointValue', 10] },
                isNeg5: { $lt: ['$pointValue', 0] },
            } },
            { $group: {
                numCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
                _id: groupByField,
                count: { $sum: 1 },
                '15s': { $sum: { $cond: ['$is15', 1, 0] } },
                '10s': { $sum: { $cond: ['$is10', 1, 0] } },
                '-5s': { $sum: { $cond: ['$isNeg5', 1, 0] } },
                totalCelerity: { $sum: '$celerity' },
                totalCorrectCelerity: { $sum: { $cond: ['$isCorrect', '$celerity', 0] } },
                totalPoints: { $sum: '$pointValue' },
                pptu: { $avg: '$pointValue' },
            } },
            { $addFields: {
                averageCorrectCelerity: { $cond: ['$numCorrect', { $divide: ['$totalCorrectCelerity', '$numCorrect'] }, 0] },
            } },
            { $sort: { pptu: -1, averageCorrectCelerity: -1, totalPoints: -1 } },
        ]).toArray();
    case 'bonus':
        return await bonusData.aggregate([
            { $match: matchDocument },
            { $addFields: { pointValue: { $sum: '$pointsPerPart' } } },
            { $addFields: {
                is30: { $eq: ['$pointValue', 30] },
                is20: { $eq: ['$pointValue', 20] },
                is10: { $eq: ['$pointValue', 10] },
                is0:  { $eq: ['$pointValue',  0] },
            } },
            { $group: {
                _id: groupByField,
                count: { $sum: 1 },
                '30s': { $sum: { $cond: ['$is30', 1, 0] } },
                '20s': { $sum: { $cond: ['$is20', 1, 0] } },
                '10s': { $sum: { $cond: ['$is10', 1, 0] } },
                '0s':  { $sum: { $cond: ['$is0',  1, 0] } },
                totalPoints: { $sum: '$pointValue' },
                ppb: { $avg: '$pointValue' },
            } },
            { $sort: { ppb: -1, totalPoints: -1 } },
        ]).toArray();
    }
}


async function getBonusGraphStats({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    const matchDocument = await generateMatchDocument({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });

    const stats = await bonusData.aggregate([
        { $match: matchDocument },
        { $addFields: { pointValue: { $sum: '$pointsPerPart' } } },
        { $addFields: {
            is30: { $eq: ['$pointValue', 30] },
            is20: { $eq: ['$pointValue', 20] },
            is10: { $eq: ['$pointValue', 10] },
            is0:  { $eq: ['$pointValue',  0] },
            createdAt: { $dateTrunc: {
                date: '$createdAt',
                unit: 'day',
                binSize: 1,
                timezone: 'America/New_York',
            } },
        } },
        { $group: {
            _id: '$createdAt',
            count: { $sum: 1 },
            '30s': { $sum: { $cond: ['$is30', 1, 0] } },
            '20s': { $sum: { $cond: ['$is20', 1, 0] } },
            '10s': { $sum: { $cond: ['$is10', 1, 0] } },
            '0s':  { $sum: { $cond: ['$is0',  1, 0] } },
            totalPoints: { $sum: '$pointValue' },
            ppb: { $avg: '$pointValue' },
        } },
        { $sort: { _id: 1 } },
    ]).toArray();

    return { stats };
}


async function getTossupGraphStats({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    const matchDocument = await generateMatchDocument({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });

    const stats = await tossupData.aggregate([
        { $match: matchDocument },
        { $addFields: {
            result: { $switch: {
                branches: [
                    { case: { $eq: ['$pointValue', 15] }, then: 'power' },
                    { case: { $eq: ['$pointValue', 10] }, then: 'ten' },
                    { case: { $eq: ['$pointValue', 0] }, then: 'dead' },
                    { case: { $eq: ['$pointValue', -5] }, then: 'neg' } ,
                ],
                default: 'other',
            } },
            createdAt: { $dateTrunc: {
                date: '$createdAt',
                unit: 'day',
                binSize: 1,
                timezone: 'America/New_York',
            } },
        } },
        { $group: {
            _id: '$createdAt',
            pptu: { $avg: '$pointValue' },
            count: { $sum: 1 },
            correct: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            powers: { $sum: { $cond: [{ $eq: ['$result', 'power'] }, 1, 0] } },
            tens: { $sum: { $cond: [{ $eq: ['$result', 'ten'] }, 1, 0] } },
            deads: { $sum: { $cond: [{ $eq: ['$result', 'dead'] }, 1, 0] } },
            negs: { $sum: { $cond: [{ $eq: ['$result', 'neg'] }, 1, 0] } },
            totalPoints: { $sum: '$pointValue' },
            totalCorrectCelerity: { $sum: { $cond: ['$isCorrect', '$celerity', 0] } },
            averageCelerity: { $avg: '$celerity' },
        } },
        { $addFields: {
            averageCorrectCelerity: { $cond: ['$correct', { $divide: ['$totalCorrectCelerity', '$correct'] }, 0] },
        } },
        { $sort: { _id: 1 } },
    ]).toArray();

    return { stats };
}


/**
 * Get the user with the given username.
 */
async function getUser(username, showPassword = false) {
    return await users.findOne(
        { username: username },
        { projection: { password: showPassword ? 1 : 0 } },
    );
}


async function getUsername(user_id) {
    if (id_to_username[user_id]) {
        return id_to_username[user_id];
    }

    const user = await users.findOne({ _id: user_id });

    if (!user) {
        return null;
    }

    id_to_username[user_id] = user.username;
    return user.username;
}


async function getUserField(username, field) {
    const user = await users.findOne({ username });
    return user ? user[field] : null;
}


/**
 * Get the user ID of the user with the given username.
 * @param {String} username
 * @returns {Promise<ObjectId>} The user ID of the user with the given username, or null if it doesn't exist.
 */
async function getUserId(username) {
    if (username_to_id[username]) {
        return username_to_id[username];
    }

    const user = await users.findOne({ username: username });

    if (!user) {
        return null;
    }

    username_to_id[username] = user._id;
    return user._id;
}


/**
 *
 * @param {String} username
 * @returns {Promise<Boolean>}
 */
async function isAdmin(username) {
    const user = await getUser(username);
    return user?.admin ?? false;
}

async function isAdminById(user_id) {
    const user = await users.findOne({ _id: user_id });
    return user?.admin ?? false;
}

async function recordBonusData(username, data) {
    const user_id = await getUserId(username);
    const { bonus } = data;
    const newData = {};
    for (const field of ['pointsPerPart']) {
        if (!data[field]) {
            return false;
        } else {
            newData[field] = data[field];
        }
    }

    if (!Object.prototype.hasOwnProperty.call(data, 'bonus')) {
        return false;
    }

    for (const field of ['category', 'subcategory', 'difficulty']) {
        if (Object.prototype.hasOwnProperty.call(bonus, field)) {
            newData[field] = bonus[field];
        }
    }

    newData.bonus_id = new ObjectId(bonus._id);
    newData.set_id = new ObjectId(bonus.set._id);
    newData.user_id = user_id;
    newData.createdAt = new Date();
    return await bonusData.insertOne(newData);
}


async function recordTossupData(username, data) {
    const user_id = await getUserId(username);
    const { tossup } = data;
    const newData = {};
    for (const field of ['celerity', 'isCorrect', 'pointValue', 'multiplayer']) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            newData[field] = data[field];
        } else {
            return false;
        }
    }

    if (!Object.prototype.hasOwnProperty.call(data, 'tossup')) {
        return false;
    }

    for (const field of ['category', 'subcategory', 'difficulty']) {
        if (Object.prototype.hasOwnProperty.call(tossup, field)) {
            newData[field] = tossup[field];
        }
    }

    newData.tossup_id = new ObjectId(tossup._id);
    newData.set_id = new ObjectId(tossup.set._id);
    newData.user_id = user_id;
    newData.createdAt = new Date();
    return await tossupData.insertOne(newData);
}


async function updateUser(username, values) {
    const user = await users.findOne({ username: username });

    if (!user)
        return false;

    if (values.email && values.email !== user.email) {
        values.verifiedEmail = false;
    }

    for (const field of ['username', 'password', 'email', 'verifiedEmail']) {
        if (Object.prototype.hasOwnProperty.call(values, field)) {
            user[field] = values[field];
        }
    }

    if (values.username) {
        if (await getUserId(values.username)) {
            return false;
        }

        username_to_id[values.username] = user._id;
        id_to_username[user._id] = values.username;
        delete username_to_id[username];
    }

    await users.updateOne({ username: username }, { $set: user });
    return true;
}


/**
 *
 * @param {String} user_id
 * @returns {Promise<Result>}
 */
async function verifyEmail(user_id) {
    return await users.updateOne(
        { _id: new ObjectId(user_id) },
        { $set: { verifiedEmail: true } },
    );
}

export {
    createUser,
    getBestBuzz,
    getCategoryStats,
    getSingleBonusStats,
    getSingleTossupStats,
    getBonusGraphStats,
    getTossupGraphStats,
    getSubcategoryStats,
    getUser,
    getUsername,
    getUserField,
    getUserId,
    isAdmin,
    isAdminById,
    recordBonusData,
    recordTossupData,
    updateUser,
    verifyEmail,
};
