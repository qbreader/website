import { getAnswer, getQuestionCount } from '../database/geoword.js';
import { checkToken } from '../server/authentication.js';
import checkAnswer from '../server/checkAnswer.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    res.sendFile('index.html', { root: './client/geoword' });
});

router.get('/index', (req, res) => {
    res.redirect('/geoword');
});

router.get('/login', (req, res) => {
    res.sendFile('login.html', { root: './client/geoword' });
});

router.get('/stats', (req, res) => {
    res.sendFile('stats.html', { root: './client/geoword' });
});

router.get('/api/check-answer', async (req, res) => {
    const { givenAnswer, questionNumber, packetName } = req.query;
    const answer = await getAnswer(packetName, parseInt(questionNumber));
    const { directive, directedPrompt } = checkAnswer(answer, givenAnswer);
    res.json({ actualAnswer: answer, directive, directedPrompt });
});

router.get('/api/get-question-count', async (req, res) => {
    const { packetName } = req.query;
    const questionCount = await getQuestionCount(packetName);
    res.json({ questionCount });
});

router.get('/audio/*.mp3', (req, res) => {
    const url = req.url.substring(7);
    res.sendFile(url, { root: './geoword-audio' });
});

export default router;
