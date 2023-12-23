import getUserId from '../../../database/account-info/get-user-id.js';
import getUserStats from '../../../database/geoword/get-user-stats.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const user_id = await getUserId(username);
    const { packetName } = req.query;
    const { buzzArray, division, leaderboard } = await getUserStats(packetName, user_id);
    res.json({ buzzArray, division, leaderboard });
});

export default router;
