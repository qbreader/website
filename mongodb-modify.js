const fs = require('fs');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const packets = database.collection('packets');
    const questions = database.collection('questions');

    let counter = 0;
    sets.find({}).forEach(async set => {
        counter++;
        if (counter % 10 === 0) {
            console.log(set.name);
        }
        for (let i = 0; i < set.packets.length; i++) {
            set.packets[i] = await packets.findOne({_id: set.packets[i]});
        }

        sets.updateOne({_id: set._id}, {$set: {packets: set.packets}});
    })
    console.log('success');
});