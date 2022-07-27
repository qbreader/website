const fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const packets = database.collection('packets');
    const questions = database.collection('questions');

    let counter = 0;
    // await sets.find({}).forEach(async set => {
    //     await questions.updateMany(
    //         { set: set._id },
    //         { $set: { difficulty: set.difficulty } },
    //         (err, result) => {
    //             if (err) console.log(err);

    //             console.log(counter, set.name);
    //             counter++;
    //         });
    // });

    // let q = await questions.aggregate([
    //     {
    //         $match: { $or: [{ answer_formatted: { $exists: true } }, { answers_formatted: { $exists: true } }] }
    //     },
    //     {
    //         $group: { _id: "$set" }
    //     }
    // ]).forEach(async set => {
    //     console.log((await sets.findOne({ _id: set._id }, {projection: {name: 1}})));
    // });

    // console.log(q);

    // console.log(await questions.updateMany({ set: new ObjectId('62df794b07cf5c5fbc9c7e91') }, {$unset: {answer_formatted: 1, answers_formatted: 1}}));
    console.log('success');
});