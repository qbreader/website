const express = require('express');
const router = express.Router();

const database = require('../server/database');
const { checkAnswer } = require('../server/scorer');

// DO NOT DECODE THE ROOM NAMES - THEY ARE SAVED AS ENCODED

router.get('/check-answer', (req, res) => {
    const answerline = decodeURIComponent(req.query.answerline);
    const givenAnswer = decodeURIComponent(req.query.givenAnswer);
    const directive = checkAnswer(answerline, givenAnswer);
    res.send(JSON.stringify(directive));
});


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


router.get('/query', async (req, res) => {
    req.query.queryString = decodeURIComponent(req.query.queryString);
    req.query.questionType = decodeURIComponent(req.query.questionType);
    req.query.searchType = decodeURIComponent(req.query.searchType);
    req.query.difficulties = decodeURIComponent(req.query.difficulties);
    req.query.categories = decodeURIComponent(req.query.categories);
    req.query.subcategories = decodeURIComponent(req.query.subcategories);
    req.query.maxReturnLength = decodeURIComponent(req.query.maxReturnLength);
    req.query.randomize = (req.query.randomize === 'true');
    req.query.regex = (req.query.regex === 'true');

    if (!['tossup', 'bonus', 'all'].includes(req.query.questionType)) {
        res.status(400).send('Invalid question type specified.');
        return;
    }

    if (!['all', 'question', 'answer'].includes(req.query.searchType)) {
        res.status(400).send('Invalid search type specified.');
        return;
    }

    if (req.query.difficulties === '') {
        req.query.difficulties = null;
    } else {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));
    }

    if (req.query.categories === '') {
        req.query.categories = null;
    } else {
        req.query.categories = req.query.categories.split(',');
    }

    if (req.query.subcategories === '') {
        req.query.subcategories = null;
    } else {
        req.query.subcategories = req.query.subcategories.split(',');
    }

    if (req.query.maxReturnLength === undefined) {
        req.query.maxReturnLength = req.query.maxQueryReturnLength;
    }

    if (isNaN(req.query.maxReturnLength) || req.query.maxReturnLength === '') {
        req.query.maxReturnLength = database.DEFAULT_QUERY_RETURN_LENGTH;
    }

    const queryResult = await database.getQuery(req.query);
    res.send(JSON.stringify(queryResult));
});


router.get('/random-name', (req, res) => {
    res.send(database.getRandomName());
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
