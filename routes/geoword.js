import { getAnswer, getBuzzCount, getQuestionCount, getUserStats, recordBuzz } from '../database/geoword.js';
import { getUserId } from '../database/users.js';
import { checkToken } from '../server/authentication.js';
import checkAnswer from '../server/checkAnswer.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/geoword' });
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

router.get('/game/:packetName', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const [buzzCount, questionCount] = await Promise.all([getBuzzCount(req.params.packetName, username), getQuestionCount(req.params.packetName)]);

    if (buzzCount >= questionCount) {
        res.redirect('/geoword/stats/' + req.params.packetName);
        return;
    }

    res.sendFile('game.html', { root: './client/geoword' });
});

router.get('/api/check-answer', async (req, res) => {
    const { givenAnswer, questionNumber, packetName } = req.query;
    const answer = await getAnswer(packetName, parseInt(questionNumber));
    const { directive, directedPrompt } = checkAnswer(answer, givenAnswer);
    res.json({ actualAnswer: answer, directive, directedPrompt });
});

router.get('/api/get-buzz-count', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const buzzCount = await getBuzzCount(req.query.packetName, username);
    res.json({ buzzCount });
});

router.get('/api/get-question-count', async (req, res) => {
    const { packetName } = req.query;
    const questionCount = await getQuestionCount(packetName);
    res.json({ questionCount });
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
    const { buzzArray, leaderboard } = await getUserStats({ packetName, user_id });
    res.json({ buzzArray, leaderboard });
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
    const result = await recordBuzz({ celerity, points, packetName, questionNumber, givenAnswer, user_id });

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.get('/audio/*.mp3', (req, res) => {
    const url = req.url.substring(7);
    res.sendFile(url, { root: './geoword-audio' });
});

export default router;
