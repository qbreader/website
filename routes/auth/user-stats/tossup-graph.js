import getUserId from '../../../database/account-info/get-user-id.js';
import getTossupGraphStats from '../../../database/account-info/stats/get-tossup-graph-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
    const user_id = await getUserId(username);
    res.json(await getTossupGraphStats({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }));
});

export default router;
