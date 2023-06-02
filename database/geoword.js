import { MongoClient } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const geoword = client.db('geoword');
const answers = geoword.collection('answers');
const buzzes = geoword.collection('buzzes');

/**
 *
 * @param {String} packetName
 * @param {Number} questionNumber
 * @returns
 */
async function getAnswer(packetName, questionNumber) {
    const result = await answers.findOne({ packetName, questionNumber });

    if (!result) {
        return '';
    } else {
        const { answer, formatted_answer } = result;
        return formatted_answer ?? answer;
    }
}

async function getQuestionCount(packetName) {
    return await answers.countDocuments({ packetName });
}

/**
 * @param {Object} params
 * @param {Decimal} params.celerity
 * @param {Boolean} params.isCorrect
 * @param {String} params.packetName
 * @param {Number} params.questionNumber
 * @param {ObjectId} params.user_id
 */
async function recordBuzz({ celerity, isCorrect, packetName, questionNumber, user_id }) {
    return await buzzes.insertOne({ user_id, packetName, questionNumber, celerity, isCorrect });
}

export { getAnswer, getQuestionCount, recordBuzz };
