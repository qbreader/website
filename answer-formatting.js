// Upload the answer formatting to existing questions

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

    const SET_NAME = '2022 PACE NSC';
    const set = await sets.findOne({ name: SET_NAME });
    console.log(set._id);

    fs.readdirSync('./output').forEach(async file => {
        if (file === '.DS_Store') return;

        const packet = JSON.parse(fs.readFileSync(`./output/${file}`));
        const packetNumber = parseInt(file.substring(0, file.indexOf('.')));
        for (let index = 0; index < packet.tossups.length; index++ ) {
            let tossup = packet.tossups[index];
            let question = await questions.findOneAndUpdate(
                { set: set._id, packetNumber: packetNumber, questionNumber: index + 1, type: "tossup" },
                { $set: { answer_formatted: tossup.answer_formatted, answer: tossup.answer } }
            );

            if (!question) return;
            question = question.value;
            if (question.answer.trim() !== tossup.answer.trim()) {
                console.log(`${file} #${index + 1} | ${question.answer} | ${tossup.answer}`);
            }
        };

        for (let index = 0; index < packet.bonuses.length; index++) {
            let bonus = packet.bonuses[index];
            let question = await questions.findOneAndUpdate(
                { set: set._id, packetNumber: packetNumber, questionNumber: index + 1, type: "bonus" },
                {
                    $set: {
                        'answers_formatted.0': bonus.answers_formatted[0],
                        'answers_formatted.1': bonus.answers_formatted[1],
                        'answers_formatted.2': bonus.answers_formatted[2],
                        'answers.0': bonus.answers[0],
                        'answers.1': bonus.answers[1],
                        'answers.2': bonus.answers[2],
                    }
                }
            );

            if (!question) return;
            question = question.value;

            for (let i = 0; i < 3; i++) {
                if (question.answers[i].trim() !== bonus.answers[i].trim()) {
                    console.log(`${file} #${index + 1} | ${question.answers[i]} | ${bonus.answers[i]}`);
                }
            }
        };

        console.log(`${file} done`);
    });
});