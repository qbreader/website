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
// eslint-disable-next-line no-unused-vars
const bonusData = database.collection('bonus-data');

const questionDatabase = client.db('qbreader');
const tossups = questionDatabase.collection('tossups');
const bonuses = questionDatabase.collection('bonuses');


const username_to_id = {};


async function createUser(username, password, email) {
    return await users.insertOne({
        username,
        password,
        email,
        verifiedEmail: false,
    });
}


async function getBestBuzz(username) {
    const user_id = await getUserId(username);
    const data = tossupData.findOne(
        { user_id: user_id, isCorrect: true },
        { sort: { celerity: -1 } },
    );
    data.tossup = await tossups.findOne({ _id: data.tossup_id });
    return data;
}


async function getCategoryStats(username) {
    const user_id = await getUserId(username);
    return await getStatsHelper(user_id, 'category');
}


async function getUserField(username, field) {
    const user = await users.findOne({ username });
    return user ? user[field] : null;
}


async function getSubcategoryStats(username) {
    const user_id = await getUserId(username);
    return await getStatsHelper(user_id, 'subcategory');
}


async function getStatsHelper(user_id, groupByField) {
    groupByField = '$' + groupByField;
    const tossups = await tossupData.aggregate([
        { $match: { user_id: user_id } },
        { $group: {
            _id: groupByField,
            count: { $sum: 1 },
            numCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
            totalCelerity: { $sum: '$celerity' },
            totalPoints: { $sum: '$pointValue' },
        } },
    ]).toArray();

    const bonuses = await bonusData.aggregate([
        { $match: { user_id: user_id } },
        { $addFields: { pointValue: { $sum: '$pointsPerPart' } } },
        { $group: {
            _id: groupByField,
            count: { $sum: 1 },
            totalPoints: { $sum: '$pointValue' },
        } },
    ]).toArray();

    return { tossups, bonuses };
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


/**
 * Get the user ID of the user with the given username.
 * @param {String} username
 * @returns {Promise<String>} The user ID of the user with the given username, or null if it doesn't exist.
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

    for (const field of ['_id', 'category', 'subcategory', 'difficulty', 'packet', 'set', 'questionNumber']) {
        if (Object.prototype.hasOwnProperty.call(data.bonus, field)) {
            newData[field] = data.bonus[field];
        }
    }

    newData.bonus_id = data.bonus._id;
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

    for (const field of ['category', 'subcategory', 'difficulty', 'packet', 'set', 'questionNumber']) {
        if (Object.prototype.hasOwnProperty.call(data.tossup, field)) {
            newData.tossup[field] = data.tossup[field];
        }
    }

    newData.tossup_id = data.tossup._id;
    newData.user_id = user_id;
    newData.createdAt = new Date();
    return await tossupData.insertOne(newData);
}


async function updateUser(username, values) {
    const user = await users.findOne({ username: username });

    if (!user)
        return false;

    if (values.email !== user.email) {
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
    getUserId,
    getSubcategoryStats,
    getQueries,
    getUser,
    getUserField,
    recordBonusData,
    recordQuery,
    recordTossupData,
    updateUser,
    verifyEmail,
};
