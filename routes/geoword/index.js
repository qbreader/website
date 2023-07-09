import * as geoword from '../../database/geoword.js';
import { isAdmin } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import compareRouter from './compare.js';
import divisionRouter from './division.js';
import gameRouter from './game.js';
import packetRouter from './packet.js';
import paymentRouter from './payment.js';
import statsRouter from './stats.js';

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

router.use('/compare/:packetName', compareRouter);

router.use('/division/:packetName', divisionRouter);

router.use('/game/:packetName', gameRouter);

router.use('/leaderboard/:packetName', (req, res) => {
    res.sendFile('leaderboard.html', { root: './client/geoword' });
});

router.use('/packet/:packetName', packetRouter);

router.use('/payment/:packetName', paymentRouter);

router.use('/stats/:packetName', statsRouter);

export default router;
