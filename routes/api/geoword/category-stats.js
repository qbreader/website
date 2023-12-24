import getUserId from '../../../database/account-info/get-user-id.js';
import getCategoryLeaderboard from '../../../database/geoword/get-category-stats.js';
import getDivisionChoice from '../../../database/geoword/get-division-choice.js';
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
    const division = await getDivisionChoice(packetName, user_id);
    const leaderboard = await getCategoryLeaderboard(packetName, division);
    res.json({ division, leaderboard, username });
});

export default router;
