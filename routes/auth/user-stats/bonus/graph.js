import getUserId from '../../../../database/account-info/get-user-id.js';
import getBonusGraphStats from '../../../../database/account-info/user-stats/get-bonus-graph-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
  const query = { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate };
  const stats = await getBonusGraphStats(userId, query);
  res.json({ stats });
});

export default router;
