const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const database = client.db('account-info');
const users = database.collection('users');
const queries = database.collection('queries');
const tossupData = database.collection('tossup-data');
const bonusData = database.collection('bonus-data');
const { getSetId, getTossupById } = require('./questions');


const username_to_id = {};


async function createUser(username, password, email) {
    return await users.insertOne({
        username,
        password,
        email,
        verifiedEmail: false,
    });
}


async function getBestBuzz(username, difficulties, setName) {
    const user_id = await getUserId(username);
    const matchDocument = { user_id: user_id, isCorrect: true };
    if (difficulties) {
        matchDocument.difficulty = { $in: difficulties };
    }

    if (setName) {
        const set_id = await getSetId(setName);
        matchDocument.set_id = set_id;
    }

    const data = await tossupData.findOne(
        matchDocument,
        { sort: { celerity: -1 } },
    );

    if (!data)
        return null;

    data.tossup = await getTossupById(data.tossup_id);
    return data;
}


async function getCategoryStats(username, questionType, difficulties, setName) {
    const user_id = await getUserId(username);
    return await getStatsHelper(user_id, questionType, 'category', difficulties, setName);
}


async function getSubcategoryStats(username, questionType, difficulties, setName) {
    const user_id = await getUserId(username);
    return await getStatsHelper(user_id, questionType, 'subcategory', difficulties, setName);
}


/**
 * Get the stats for a single bonus.
 * @param {ObjectId} bonus_id the bonus id
 * @returns {Promise<Document>} the bonus stats
 */
async function getSingleBonusStats(bonus_id) {
    const result = await bonusData.aggregate([
        { $match: { bonus_id } },
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


async function getStatsHelper(user_id, questionType, groupByField, difficulties, setName) {
    groupByField = '$' + groupByField;

    const matchDocument = { user_id: user_id };
    if (difficulties) {
        matchDocument.difficulty = { $in: difficulties };
    }

    if (setName) {
        const set_id = await getSetId(setName);
        matchDocument.set_id = set_id;
    }

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
            { $sort: { pptu: -1, totalPoints: -1 } },
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


async function getQueries(username) {
    const user_id = await getUserId(username);
    return await queries.find(
        { user_id },
        { sort: { createdAt: -1 } },
    ).toArray();
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
    const user = await users.findOne({ _id: user_id });
    return user ? user.username : null;
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

    return await users.findOne({ username: username }).then((user) => {
        if (!user) {
            return null;
        }

        username_to_id[username] = user._id;
        return user._id;
    });
}


async function recordBonusData(username, data) {
    const user_id = await getUserId(username);
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

    for (const field of ['category', 'subcategory', 'difficulty', 'questionNumber']) {
        if (Object.prototype.hasOwnProperty.call(data.bonus, field)) {
            newData[field] = data.bonus[field];
        }
    }

    for (const field of ['packet', 'set']) {
        if (Object.prototype.hasOwnProperty.call(data.bonus, field)) {
            newData[field] = new ObjectId(data.bonus[field]);
        }
    }

    newData.bonus_id = new ObjectId(data.bonus._id);
    newData.user_id = user_id;
    newData.createdAt = new Date();
    return await bonusData.insertOne(newData);
}


async function recordQuery(username, query) {
    const user_id = await getUserId(username);
    if (await queries.countDocuments({ user_id }) >= 10) {
        const oldest = await queries.findOne(
            { user_id },
            { sort: { createdAt: 1 } },
        );
        queries.deleteOne({ _id: oldest._id });
    }

    return await queries.insertOne({
        user_id,
        query,
        createdAt: new Date(),
    });
}


async function recordTossupData(username, data) {
    const user_id = await getUserId(username);
    const newData = {};
    for (const field of ['celerity', 'isCorrect', 'pointValue']) {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            newData[field] = data[field];
        } else {
            return false;
        }
    }

    if (!Object.prototype.hasOwnProperty.call(data, 'tossup')) {
        return false;
    }

    for (const field of ['category', 'subcategory', 'difficulty', 'questionNumber']) {
        if (Object.prototype.hasOwnProperty.call(data.tossup, field)) {
            newData[field] = data.tossup[field];
        }
    }

    for (const field of ['packet', 'set']) {
        if (Object.prototype.hasOwnProperty.call(data.tossup, field)) {
            newData[field] = new ObjectId(data.tossup[field]);
        }
    }

    newData.tossup_id = new ObjectId(data.tossup._id);
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
        username_to_id[values.username] = user._id;
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

module.exports = {
    createUser,
    getBestBuzz,
    getCategoryStats,
    getQueries,
    getSingleBonusStats,
    getSingleTossupStats,
    getSubcategoryStats,
    getUser,
    getUsername,
    getUserField,
    getUserId,
    recordBonusData,
    recordQuery,
    recordTossupData,
    updateUser,
    verifyEmail,
};
