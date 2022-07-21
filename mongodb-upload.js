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

    const PACKET_DIRECTORY = 'packets/';
    fs.readdirSync(PACKET_DIRECTORY).forEach(setName => {
        if (setName.endsWith('.sh') || setName == '.DS_Store') return;

        let set = {_id: new ObjectId(), name: setName, packets: []};
        fs.readdirSync(PACKET_DIRECTORY + setName).forEach(packetName => {
            if (!packetName.endsWith('.json')) return;

            let packet = {_id: new ObjectId(), name: packetName.slice(0, -5), questions: []};
            set.packets.push(packet._id);
            let data = JSON.parse(fs.readFileSync(PACKET_DIRECTORY + setName + '/' + packetName));
            let tossups = data.tossups;
            let bonuses = data.bonuses;

            if (tossups) {
                tossups.forEach((tossup, index) => {
                    tossup._id = new ObjectId();
                    tossup.packet = packet._id;
                    tossup.set = set._id;
                    tossup.type = 'tossup';
                    tossup.number = tossup.number || (index + 1);
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
                    bonus._id = new ObjectId();
                    bonus.packet = packet._id;
                    bonus.set = set._id;
                    bonus.type = 'bonus';
                    bonus.number = bonus.number || (index + 1);
                    bonus.createdAt = bonus.createdAt || new Date();
                    bonus.updatedAt = bonus.updatedAt || new Date();
                    questions.insertOne(bonus);
                    packet.bonuses.push(bonus._id);
                });
            } else {
                console.log('no bonuses for ' + setName + '/' + packetName);
            }
            packets.insertOne(packet);
        });
        sets.insertOne(set);
    });
    console.log('success');
});