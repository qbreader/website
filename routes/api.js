const express = require('express');
const router = express.Router();
const fs = require('fs');
const rooms = require('../rooms');
const database = require('../database');

// DO NOT DECODE THE ROOM NAMES - THEY ARE SAVED AS ENCODED

router.get('/num-packets', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    const numPackets = await database.getNumPackets(req.query.setName);
    res.send(JSON.stringify({ value: numPackets }));
});

router.get('/packet', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    req.query.packetNumber = parseInt(decodeURIComponent(req.query.packetNumber));
    const packet = await database.getPacket(req.query.setName, req.query.packetNumber);
    res.send(JSON.stringify(packet));
});

router.get('/packet-bonuses', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    req.query.packetNumber = parseInt(decodeURIComponent(req.query.packetNumber));
    const packet = await database.getPacket(req.query.setName, req.query.packetNumber, ['bonuses']);
    res.send(JSON.stringify(packet));
});

router.get('/packet-tossups', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    req.query.packetNumber = parseInt(decodeURIComponent(req.query.packetNumber));
    const packet = await database.getPacket(req.query.setName, req.query.packetNumber, ['tossups']);
    res.send(JSON.stringify(packet));
});

router.get('/multiplayer/current-question', async (req, res) => {
    res.send(JSON.stringify(rooms.getCurrentQuestion(req.query.roomName)));
});

router.get('/multiplayer/room', (req, res) => {
    res.send(JSON.stringify(rooms.getRoom(req.query.roomName)));
});

router.get('/multiplayer/room-list', (req, res) => {
    res.send(JSON.stringify({ 'rooms': rooms.getRoomList() }))
});

module.exports = router;