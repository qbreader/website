import { getAdminStats, getBuzzes, getLeaderboard, getPlayerList, getProtests, resolveProtest } from '../../../database/geoword.js';
import getUserId from '../../../database/account-info/get-user-id.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/compare', async (req, res) => {
    const { packetName, division, player1, player2 } = req.query;
    const player1Buzzes = await getBuzzes(packetName, division, await getUserId(player1));
    const player2Buzzes = await getBuzzes(packetName, division, await getUserId(player2));
    res.json({ player1Buzzes, player2Buzzes });
});

router.get('/leaderboard', async (req, res) => {
    const { packetName, division, includeInactive } = req.query;
    const leaderboard = await getLeaderboard(packetName, division, includeInactive === 'true');
    res.json({ leaderboard });
});

router.get('/player-list', async (req, res) => {
    const { packetName, division } = req.query;
    const players = await getPlayerList(packetName, division);
    res.json({ players });
});

router.get('/protests', async (req, res) => {
    const { packetName, division } = req.query;
    const { protests, packet } = await getProtests(packetName, division);
    res.json({ protests, packet });
});

router.post('/resolve-protest', async (req, res) => {
    const { buzz_id, decision, reason } = req.body;
    const result = await resolveProtest(new ObjectId(buzz_id), decision, reason);

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.get('/stats', async (req, res) => {
    const { packetName, division } = req.query;
    const stats = await getAdminStats(packetName, division);
    res.json({ stats });
});

export default router;
