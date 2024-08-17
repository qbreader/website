import * as AWS from '@aws-sdk/client-s3';
import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
export const mongoClient = new MongoClient(uri);

await mongoClient.connect();
console.log('connected to mongodb');

export const qbreader = mongoClient.db('qbreader');
export const accountInfo = mongoClient.db('account-info');
export const geoword = mongoClient.db('geoword');

export const bucketName = process.env.BUCKETEER_BUCKET_NAME;
export const s3 = new AWS.S3({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY
  }
});
