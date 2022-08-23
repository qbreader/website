if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');
});

const database = client.db('qbreader');
const questions = database.collection('questions');
const sets = database.collection('sets');

// list all questions that have a report
questions.find({ reports: { $exists: true }, type: 'tossup' }, { sort: { reports: -1 } }).forEach(async question => {
    const setName = (await sets.findOne({ _id: question.set }, { projection: { _id: 0, name: 1 } })).name;
    const string = `Number of reports: ${question.reports}\n${setName} Packet ${question.packetNumber} Question ${question.questionNumber}\n${question.question}\nANSWER: ${question.answer}`;
    console.log(string);
});