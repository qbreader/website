import * as geoword from '../database/geoword.js';
import { getUserId } from '../database/users.js';
import { checkToken } from '../server/authentication.js';
import checkAnswer from '../server/checkAnswer.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/geoword' });
});

router.get('/audio/*.mp3', (req, res) => {
    const url = req.url.substring(7);
    res.sendFile(url, { root: './geoword-audio' });
});

router.get('/audio', (req, res) => {
    const { packetName, division, currentQuestionNumber } = req.query;
    res.sendFile(`${packetName}/${division}/${currentQuestionNumber}.mp3`, { root: './geoword-audio' });
});

router.get('/division/:packetName', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const divisionChoice = await geoword.getDivisionChoice(req.params.packetName, username);
    if (divisionChoice) {
        res.redirect('/geoword/game/' + req.params.packetName);
        return;
    }

    res.sendFile('division.html', { root: './client/geoword' });
});

router.get('/game/:packetName', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const packetName = req.params.packetName;

    const divisionChoice = await geoword.getDivisionChoice(packetName, username);
    if (!divisionChoice) {
        res.redirect('/geoword/division/' + packetName);
        return;
    }

    const [buzzCount, questionCount] = await Promise.all([
        geoword.getBuzzCount(packetName, username),
        geoword.getQuestionCount(packetName),
    ]);

    if (buzzCount >= questionCount) {
        res.redirect('/geoword/stats/' + packetName);
        return;
    }

    res.sendFile('game.html', { root: './client/geoword' });
});

router.get('/index', (req, res) => {
    res.redirect('/geoword');
});

router.get('/login', (req, res) => {
    res.sendFile('login.html', { root: './client/geoword' });
});

router.get('/stats/:packetName', (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    res.sendFile('stats.html', { root: './client/geoword' });
});

router.get('/api/check-answer', async (req, res) => {
    const { givenAnswer, questionNumber, packetName } = req.query;
    const answer = await geoword.getAnswer(packetName, parseInt(questionNumber));
    const { directive, directedPrompt } = checkAnswer(answer, givenAnswer);
    res.json({ actualAnswer: answer, directive, directedPrompt });
});

router.get('/api/get-progress', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const packetName = req.query.packetName;
    const { division, numberCorrect, points, totalCorrectCelerity, tossupsHeard } = await geoword.getProgress(packetName, username);

    res.json({ division, numberCorrect, points, totalCorrectCelerity, tossupsHeard });
});

router.get('/api/get-divisions', async (req, res) => {
    const divisions = await geoword.getDivisions(req.query.packetName);
    res.json({ divisions });
});

router.get('/api/packet-list', async (req, res) => {
    const packetList = await geoword.getPacketList();
    res.json({ packetList });
});

router.get('/api/get-question-count', async (req, res) => {
    const { packetName } = req.query;
    const questionCount = await geoword.getQuestionCount(packetName);
    res.json({ questionCount });
});

router.put('/api/record-division', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const { packetName, division } = req.body;
    const result = await geoword.recordDivision({ packetName, username, division });

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.put('/api/record-protest', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const { packetName, questionNumber } = req.body;
    const result = await geoword.recordProtest({ packetName, questionNumber, username });

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});


router.get('/api/stats', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const user_id = await getUserId(username);
    const { packetName } = req.query;
    const { buzzArray, division, leaderboard } = await geoword.getUserStats({ packetName, user_id });
    res.json({ buzzArray, division, leaderboard });
});

router.get('/api/record-buzz', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    req.query.celerity = parseFloat(req.query.celerity);
    req.query.points = parseInt(req.query.points);
    req.query.questionNumber = parseInt(req.query.questionNumber);

    const user_id = await getUserId(username);
    const { packetName, questionNumber, celerity, points, givenAnswer } = req.query;
    const result = await geoword.recordBuzz({ celerity, points, packetName, questionNumber, givenAnswer, user_id });

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export default router;
