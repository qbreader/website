const express = require('express');
const router = express.Router();
const fs = require('fs');
const rooms = require('../rooms');
const database = require('../database');

// DO NOT DECODE THE ROOM NAMES - THEY ARE SAVED AS ENCODED

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
    res.send(JSON.stringify(rooms.getRoom(req.query.roomName)));
});

router.get('/get-room-list', (req, res) => {
    res.send(JSON.stringify({ 'rooms': rooms.getRoomList() }))
});

router.get('/get-packet', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    res.send(JSON.stringify(await database.getPacket(req.query.setName, req.query.packetNumber)));
});

router.get('/get-current-question', async (req, res) => {
    res.send(JSON.stringify(rooms.getCurrentQuestion(req.query.roomName)));
});

router.get('/get-num-packets', async (req, res) => {
    res.send(JSON.stringify({
        value: await database.getNumPackets(req.query.setName)
    }));
});

module.exports = router;