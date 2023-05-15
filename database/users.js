const { MongoClient } = require('mongodb');

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


async function createUser(username, password, email) {
    return await users.insertOne({
        username,
        password,
        email,
        verified: false,
    });
}


async function getBestBuzz(username) {
    return await tossupData.findOne(
        { username: username, isCorrect: true },
        { sort: { celerity: -1 } },
    );
}


/**
 * Get the password of the user with the given username.
 * @param {String} username
 * @returns {Promise<String>} The password of the user with the given username, or null if it doesn't exist.
 */
async function getPassword(username) {
    const user = await users.findOne({ username: username });
    return user ? user.password : null;
}


async function getQueries(username) {
    return await queries.find(
        { username: username },
        { sort: { createdAt: -1 } },
    ).toArray();
}


/**
 * Get the user with the given username.
 */
async function getUser(username) {
    return await users.findOne({ username: username });
}


async function recordBonusData(username, data) {
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
        if (data[field]) {
            newData[field] = data.bonus[field];
        }
    }

    newData.username = username;
    newData.createdAt = new Date();
    return await bonusData.insertOne(newData);
}


async function recordQuery(username, query) {
    if (await queries.countDocuments({ username: username }) >= 10) {
        const oldest = await queries.findOne(
            { username: username },
            { sort: { createdAt: 1 } },
        );
        queries.deleteOne({ _id: oldest._id });
    }

    return await queries.insertOne({
        username,
        query,
        createdAt: new Date(),
    });
}


async function recordTossupData(username, data) {
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

    for (const field of ['_id', 'category', 'subcategory', 'difficulty', 'packet', 'set', 'questionNumber']) {
        if (data[field]) {
            newData[field] = data.tossup[field];
        }
    }

    newData.username = username;
    newData.createdAt = new Date();
    return await tossupData.insertOne(newData);
}


async function updateUser(username, values) {
    const user = await users.findOne({ username: username });

    if (!user)
        return false;

    for (const field of ['username', 'password', 'email']) {
        if (values[field]) {
            user[field] = values[field];
        }
    }

    if (values.email) {
        user.verifiedEmail = false;
    }

    await users.updateOne({ username: username }, { $set: user });
    return true;
}


module.exports = {
    createUser,
    getBestBuzz,
    getPassword,
    getQueries,
    getUser,
    recordBonusData,
    recordQuery,
    recordTossupData,
    updateUser,
};
