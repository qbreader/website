if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const fs = require('fs');
const { MongoClient, ObjectId } = require('mongodb');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(() => {
    console.log('connected to mongodb');

    const database = client.db('qbreader');
    const sets = database.collection('sets');
    const questions = database.collection('questions');

    const PACKET_DIRECTORY = 'packets/';
    fs.readdirSync(PACKET_DIRECTORY).forEach(async setName => {
        let packetNumber = 0;
        if (setName.endsWith('.sh') || setName == '.DS_Store') return;

        if (await sets.findOne({ name: setName })) {
            console.log(`${setName} already exists`);
            return;
        }

        let set = {_id: new ObjectId(), name: setName, packets: []};
        fs.readdirSync(PACKET_DIRECTORY + setName).forEach((packetName) => {
            if (!packetName.endsWith('.json')) return;

            packetNumber++;
            let packet = {_id: new ObjectId(), name: packetName.slice(0, -5), tossups: [], bonuses: []};
            let data = JSON.parse(fs.readFileSync(PACKET_DIRECTORY + setName + '/' + packetName));
            let tossups = data.tossups;
            let bonuses = data.bonuses;

            if (tossups) {
                tossups.forEach((tossup, index) => {
                    tossup._id = new ObjectId();
                    tossup.packet = packet._id;
                    tossup.set = set._id;
                    tossup.type = 'tossup';
                    tossup.packetNumber = packetNumber;
                    tossup.questionNumber = tossup.questionNumber || (index + 1);
                    tossup.createdAt = tossup.createdAt || new Date();
                    tossup.updatedAt = tossup.updatedAt || new Date();
                    questions.insertOne(tossup);
                    packet.tossups.push(tossup._id);
                });
            } else {
                console.log('no tossups for ' + setName + '/' + packetName);
            }

            if (bonuses) {
                bonuses.forEach((bonus, index) => {
                    delete bonus.values;
                    bonus._id = new ObjectId();
                    bonus.packet = packet._id;
                    bonus.set = set._id;
                    bonus.type = 'bonus';
                    bonus.packetNumber = packetNumber;
                    bonus.questionNumber = bonus.questionNumber || (index + 1);
                    bonus.createdAt = bonus.createdAt || new Date();
                    bonus.updatedAt = bonus.updatedAt || new Date();
                    questions.insertOne(bonus);
                    packet.bonuses.push(bonus._id);
                });
            } else {
                console.log('no bonuses for ' + setName + '/' + packetName);
            }
            set.packets.push(packet);
        });
        sets.insertOne(set, (err, result) => {
            if (err) console.log(err);
            console.log(setName + ' inserted');
        });
    });
});