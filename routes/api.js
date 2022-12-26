const express = require('express');
const router = express.Router();

const database = require('../server/database');

// DO NOT DECODE THE ROOM NAMES - THEY ARE SAVED AS ENCODED

router.get('/num-packets', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    const numPackets = await database.getNumPackets(req.query.setName);
    if (numPackets === 0) {
        res.statusCode = 404;
    }
    res.send(numPackets.toString());
});

router.get('/packet', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    req.query.packetNumber = parseInt(decodeURIComponent(req.query.packetNumber));
    const packet = await database.getPacket({ setName: req.query.setName, packetNumber: req.query.packetNumber });
    if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify(packet));
});

router.get('/packet-bonuses', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    req.query.packetNumber = parseInt(decodeURIComponent(req.query.packetNumber));
    const packet = await database.getPacket({ setName: req.query.setName, packetNumber: req.query.packetNumber, questionTypes: ['bonuses'] });
    if (packet.bonuses.length === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify(packet));
});

router.get('/packet-tossups', async (req, res) => {
    req.query.setName = decodeURIComponent(req.query.setName);
    req.query.packetNumber = parseInt(decodeURIComponent(req.query.packetNumber));
    const packet = await database.getPacket({ setName: req.query.setName, packetNumber: req.query.packetNumber, questionTypes: ['tossups'] });
    if (packet.tossups.length === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify(packet));
});

router.get('/random-name', (req, res) => {
    res.send(database.getRandomName());
});


router.post('/query', async (req, res) => {
    if (!['tossup', 'bonus', 'all'].includes(req.body.questionType)) {
        res.status(400).send('Invalid question type specified.');
        return;
    }

    if (!['all', 'question', 'answer'].includes(req.body.searchType)) {
        res.status(400).send('Invalid search type specified.');
        return;
    }

    if (typeof req.body.difficulties === 'string') {
        req.body.difficulties = parseInt(req.body.difficulties);
    }

    if (typeof req.body.difficulties === 'number') {
        req.body.difficulties = [req.body.difficulties];
    }

    if (typeof req.body.categories === 'string') {
        req.body.categories = [req.body.categories];
    }

    if (typeof req.body.subcategories === 'string') {
        req.body.subcategories = [req.body.subcategories];
    }

    if (req.body.maxReturnLength === undefined) {
        req.body.maxReturnLength = req.body.maxQueryReturnLength;
    }

    if (isNaN(req.body.maxReturnLength) || req.body.maxReturnLength === '') {
        req.body.maxReturnLength = database.DEFAULT_QUERY_RETURN_LENGTH;
    }

    const queryResult = await database.getQuery(req.body);
    res.send(JSON.stringify(queryResult));
});

router.post('/random-question', async (req, res) => {
    if (!['tossup', 'bonus'].includes(req.body.questionType)) {
        res.status(400).send('Invalid question type specified.');
        return;
    }

    if (typeof req.body.difficulties === 'string') {
        req.body.difficulties = parseInt(req.body.difficulties);
    }

    if (typeof req.body.difficulties === 'number') {
        req.body.difficulties = [req.body.difficulties];
    }

    if (typeof req.body.categories === 'string') {
        req.body.categories = [req.body.categories];
    }

    if (typeof req.body.subcategories === 'string') {
        req.body.subcategories = [req.body.subcategories];
    }

    const questions = await database.getRandomQuestions(req.body);
    if (questions.length > 0) {
        res.send(JSON.stringify(questions));
    } else {
        res.sendStatus(404);
    }
});


router.post('/report-question', async (req, res) => {
    const _id = req.body._id;
    const reason = req.body.reason ?? '';
    const description = req.body.description ?? '';
    const successful = await database.reportQuestion(_id, reason, description);
    if (successful) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.get('/set-list', (req, res) => {
    const setList = database.getSetList(req.query.setName);
    res.send(setList);
});

module.exports = router;
