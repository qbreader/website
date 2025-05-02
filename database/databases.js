import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader2.z35tynb.mongodb.net/?retryWrites=true&w=majority`;
export const mongoClient = new MongoClient(uri);

await mongoClient.connect();
console.log('connected to mongodb');

export const qbreader = mongoClient.db('qbreader');
export const accountInfo = mongoClient.db('account-info');
export const geoword = mongoClient.db('geoword');
