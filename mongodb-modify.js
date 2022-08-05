const fs = require('fs');

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
const sets = database.collection('sets');
const questions = database.collection('questions');


async function deleteSet(setName) {
    let set = await sets.findOne({ name: setName });
    sets.deleteOne({ name: setName });
    console.log(await questions.deleteMany({ set: set._id }));
}


function listSetsWithAnswerFormatting() {
    questions.aggregate([
        {
            $match: { $or: [{ answer_formatted: { $exists: true } }, { answers_formatted: { $exists: true } }] }
        },
        {
            $group: { _id: "$set" }
        }
    ]).forEach(async set => {
        console.log((await sets.findOne({ _id: set._id }, { projection: { _id: 0, name: 1 } })).name);
    });
}


function standardizeSubcategories() {
    const cats = require('./subcat-to-cat.json');
    const subcats = require('./standardize-subcats.json');

    questions.find({}, { projection: { _id: 1, category: 1, subcategory: 1 } }).forEach(question => {
        if (question.subcategory === undefined || question.subcategory in cats) {
            return;
        } else if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            questions.updateOne({ _id: question._id }, { $set: { category: cats[question.subcategory], subcategory: question.subcategory } });
        } else {
            console.log(`${question.subcategory} not found`);
        }
    });
}


function updateSetDifficulty(setName, difficulty) {
    sets.updateOne({ name: setName }, { $set: { difficulty: difficulty } });

    sets.find({ name: setName }).forEach(set => {
        questions.updateMany(
            { set: set._id },
            { $set: { difficulty: difficulty, updatedAt: new Date() } },
            (err, result) => {
                if (err) console.log(err);

                console.log(`Updated ${set.name} difficulty to ${difficulty}`);
            });
    });
}


// listSetsWithAnswerFormatting();
// updateSetDifficulty('2011 PACE NSC', 5);