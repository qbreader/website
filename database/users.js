const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const database = client.db('account-info');
const users = database.collection('users');


async function createUser(username, password, email) {
    return await users.insertOne({
        username,
        password,
        email,
        verified: false,
    });
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


/**
 * Get the user with the given username.
 */
async function getUser(username) {
    return await users.findOne({ username: username });
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
    getPassword,
    getUser,
    updateUser,
};
