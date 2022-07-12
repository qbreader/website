const express = require('express');
const router = express.Router();
const fs = require('fs');
const rooms = require('../rooms');
const database = require('../database');

router.post('/give-answer', (req, res) => {
    let roomName = req.body.roomName;
    let userId = req.body.userId;
    let answer = decodeURIComponent(req.body.answer);
    let inPower = req.body.inPower;
    let endOfQuestion = req.body.endOfQuestion;

    let score = rooms.checkAnswerCorrectness(roomName, answer, inPower, endOfQuestion);
    rooms.updateScore(roomName, userId, score);
    res.send(JSON.stringify({
        score: score
    }));
});

router.get('/get-room', (req, res) => {
    req.query.roomName = decodeURI(req.query.roomName);
    res.send(JSON.stringify(rooms.getRoom(req.query.roomName)));
});

router.get('/get-room-list', (req, res) => {
    res.send(JSON.stringify({ 'rooms': rooms.getRoomList() }))
});

router.get('/get-packet', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.setName = decodeURI(req.query.setName);
    try {
        res.send(JSON.stringify(database.getPacket(req.query.year, req.query.setName, req.query.packetNumber)));
    } catch (error) {
        res.send(JSON.stringify({}));
    }
});

router.get('/get-current-question', async (req, res) => {
    req.query.roomName = decodeURIComponent(req.query.roomName);
    res.send(JSON.stringify(rooms.getCurrentQuestion(req.query.roomName)));
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
        console.log('ERROR: Could not find directory ' + directory);
        res.send(JSON.stringify({ num_packets: 0 }));
    }
});

module.exports = router;