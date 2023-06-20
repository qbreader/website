import * as geoword from '../database/geoword.js';
import { isAdmin } from '../database/users.js';
import { checkToken } from '../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/geoword' });
});

router.get('/admin', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const admin = await isAdmin(username);

    if (!admin) {
        res.redirect('/geoword');
        return;
    }

    res.sendFile('index.html', { root: './client/geoword/admin' });
});

router.get('/admin/protests/:packetName/:division', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const admin = await isAdmin(username);

    if (!admin) {
        res.redirect('/geoword');
        return;
    }

    res.sendFile('protests.html', { root: './client/geoword/admin' });
});

router.get('/admin/stats/:packetName/:division', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const admin = await isAdmin(username);

    if (!admin) {
        res.redirect('/geoword');
        return;
    }

    res.sendFile('stats.html', { root: './client/geoword/admin' });
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

router.get('/leaderboard/:packetName/:division', (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    res.sendFile('leaderboard.html', { root: './client/geoword' });
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

export default router;
