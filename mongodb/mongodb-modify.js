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


async function deleteSet(setName) {
    let set = await sets.findOne({ name: setName });
    sets.deleteOne({ name: setName });
    console.log(await questions.deleteMany({ set: set._id }));
}


function deleteReports() {
    questions.updateMany({ reports: { $exists: true } }, { $unset: { reports: '' } }).then(result => {
        console.log(result);
    });
}


function listSetsWithAnswerFormatting() {
    questions.aggregate([
        {
            $match: { $or: [{ formatted_answer: { $exists: true } }, { formatted_answers: { $exists: true } }] }
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

    let counter = 0;
    questions.find({}, { projection: { _id: 1, category: 1, subcategory: 1 } }).forEach(question => {
        counter++;
        if (question.subcategory === undefined || question.subcategory in cats) {

        } else if (question.subcategory in subcats) {
            console.log(`${question.subcategory} -> ${subcats[question.subcategory]}`);
            question.subcategory = subcats[question.subcategory];
            questions.updateOne({ _id: question._id }, { $set: { category: cats[question.subcategory], subcategory: question.subcategory } });
        } else {
            console.log(`${question.subcategory} not found`);
        }

        if (counter % 5000 === 0) {
            console.log(counter);
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
