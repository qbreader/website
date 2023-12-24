import getUserId from '../../../database/account-info/get-user-id.js';
import getUserCategoryStats from '../../../database/geoword/get-user-category-stats.js';
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
    const { division, leaderboard, userStats } = await getUserCategoryStats(packetName, user_id);
    res.json({ division, leaderboard, userStats });
});

export default router;
