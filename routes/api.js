const express = require('express');
const router = express.Router();
const fs = require('fs');
const rooms = require('../rooms');

router.post('/give-answer', (req, res) => {
    let roomName = req.body.roomName;
    let userId = req.body.userId;
    let answer = decodeURIComponent(req.body.answer);

    rooms.updateScore(roomName, userId, 10);
    res.send(JSON.stringify({
        score: 10
    }));
});

router.get('/get-room', (req, res) => {
    req.query.room = decodeURI(req.query.room);
    res.send(JSON.stringify(rooms.getRoom(req.query.room)));
});

router.get('/get-room-list', (req, res) => {
    res.send(JSON.stringify({ 'rooms': rooms.getRoomList() }))
});

router.get('/get-packet', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.setName = decodeURI(req.query.setName.toLowerCase());
    req.query.setName = req.query.setName.replace(/\s/g, '_');
    var directory = `../packets/${req.query.year}-${req.query.setName}/${req.query.packet_number}.json`;
    try {
        var jsonfile = require(directory);
        res.send(JSON.stringify(jsonfile));
    } catch (error) {
        console.log('ERROR: Could not find packet located at ' + directory);
        res.send(JSON.stringify({}));
    }
});

router.get('/get-num-packets', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.setName = decodeURI(req.query.setName.toLowerCase());
    req.query.setName = req.query.setName.replace(/\s/g, '_');
    var directory = `packets/${req.query.year}-${req.query.setName}`;
    var numPackets = 0;
    try {
        fs.readdirSync(directory).forEach(file => {
            if (file.endsWith('.json')) {
                numPackets++;
            }
        });
        res.send(JSON.stringify({ num_packets: numPackets.toString() }));
    } catch (error) {
        console.log(error);
        console.log('ERROR: Could not find directory ' + directory);
        res.send(JSON.stringify({ num_packets: 0 }));
    }
});

module.exports = router;