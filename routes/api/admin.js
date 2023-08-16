import * as geoword from '../../database/geoword.js';
import { getReports, updateSubcategory } from '../../database/questions.js';
import { getUserId, isAdmin } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.use(async (req, res, next) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const admin = await isAdmin(username);
    if (!admin) {
        res.status(403).redirect('/user/my-profile');
        return;
    }

    next();
});

router.get('/list-reports', async (req, res) => {
    const { reason } = req.query;
    return res.json(await getReports(reason));
});

router.get('/geoword/compare', async (req, res) => {
    const { packetName, division, player1, player2 } = req.query;
    const player1Buzzes = await geoword.getBuzzes(packetName, division, await getUserId(player1));
    const player2Buzzes = await geoword.getBuzzes(packetName, division, await getUserId(player2));
    res.json({ player1Buzzes, player2Buzzes });
});

router.get('/geoword/leaderboard', async (req, res) => {
    const { packetName, division, includeInactive } = req.query;
    const leaderboard = await geoword.getLeaderboard(packetName, division, includeInactive === 'true');
    res.json({ leaderboard });
});

router.get('/geoword/player-list', async (req, res) => {
    const { packetName, division } = req.query;
    const players = await geoword.getPlayerList(packetName, division);
    res.json({ players });
});

router.get('/geoword/protests', async (req, res) => {
    const { packetName, division } = req.query;
    const { protests, packet } = await geoword.getProtests(packetName, division);
    res.json({ protests, packet });
});

router.post('/geoword/resolve-protest', async (req, res) => {
    const { buzz_id, decision, reason } = req.body;
    const result = await geoword.resolveProtest(new ObjectId(buzz_id), decision, reason);

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.get('/geoword/stats', async (req, res) => {
    const { packetName, division } = req.query;
    const stats = await geoword.getAdminStats(packetName, division);
    res.json({ stats });
});

router.put('/update-subcategory', async (req, res) => {
    const { _id, type, subcategory } = req.body;
    const result = await updateSubcategory(new ObjectId(_id), type, subcategory);

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export default router;
