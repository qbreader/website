import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function connectToDatabase(log=false) {
    await client.connect();

    if (log) {
        console.log('connected to mongodb');
    }
}

async function closeDatabase() {
    await client.close();
}

await connectToDatabase(true);

const qbreader = client.db('qbreader');
const accountInfo = client.db('account-info');
const geoword = client.db('geoword');

export {
    connectToDatabase,
    closeDatabase,
    qbreader,
    accountInfo,
    geoword,
};
