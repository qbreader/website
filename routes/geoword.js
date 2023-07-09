import * as geoword from '../database/geoword.js';
import { isAdmin } from '../database/users.js';
import { checkToken } from '../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/geoword' });
});

router.use('/admin', (req, res) => {
    res.redirect('/admin/geoword' + req.url);
});

router.get('/audio/*.mp3', (req, res) => {
    const url = req.url.substring(7);
    res.sendFile(url, { root: './geoword-audio' });
});

router.get('/audio', (req, res) => {
    const { packetName, division, currentQuestionNumber } = req.query;
    res.sendFile(`${packetName}/${division}/${currentQuestionNumber}.mp3`, { root: './geoword-audio' });
});

router.get('/confirmation', (req, res) => {
    res.sendFile('confirmation.html', { root: './client/geoword' });
});

router.get('/index', (req, res) => {
    res.redirect('/geoword');
});

router.get('/login', (req, res) => {
    res.sendFile('login.html', { root: './client/geoword' });
});


router.use('/*/:packetName', async (req, res, next) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const packetName = req.params.packetName;
    const status = await geoword.getPacketStatus(packetName);

    if (status === null) {
        res.redirect('/geoword');
        return;
    }

    const admin = await isAdmin(username);
    if (status === false && !admin) {
        res.redirect('/geoword');
        return;
    }

    next();
});

router.get('/division/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const divisionChoice = await geoword.getDivisionChoice(packetName, username);

    if (divisionChoice) {
        res.redirect('/geoword/game/' + packetName);
        return;
    }

    const paid = await geoword.checkPayment({ packetName, username });

    if (!paid) {
        res.redirect('/geoword/payment/' + packetName);
        return;
    }

    res.sendFile('division.html', { root: './client/geoword' });
});

router.get('/game/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const division = await geoword.getDivisionChoice(packetName, username);

    if (!division) {
        res.redirect('/geoword/division/' + packetName);
        return;
    }

    const paid = await geoword.checkPayment({ packetName, username });

    if (!paid) {
        res.redirect('/geoword/payment/' + packetName);
        return;
    }

    const [buzzCount, questionCount] = await Promise.all([
        geoword.getBuzzCount(packetName, username),
        geoword.getQuestionCount(packetName, division),
    ]);

    if (buzzCount >= questionCount) {
        res.redirect('/geoword/stats/' + packetName);
        return;
    }

    res.sendFile('game.html', { root: './client/geoword' });
});

router.get('/leaderboard/:packetName', (req, res) => {
    res.sendFile('leaderboard.html', { root: './client/geoword' });
});

router.get('/packet/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;

    const paid = await geoword.checkPayment({ packetName, username });

    if (paid) {
        res.sendFile('packet.html', { root: './client/geoword' });
        return;
    }

    res.redirect('/geoword/payment/' + packetName);
});

router.get('/payment/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const paid = await geoword.checkPayment({ packetName, username });

    if (paid) {
        res.redirect('/geoword/division/' + packetName);
        return;
    }

    res.sendFile('payment.html', { root: './client/geoword' });
});

router.get('/stats/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const paid = await geoword.checkPayment({ packetName, username });

    if (!paid) {
        res.redirect('/geoword/payment/' + packetName);
        return;
    }

    res.sendFile('stats.html', { root: './client/geoword' });
});

export default router;
