import getUserId from '../../../../../database/account-info/get-user-id.js';
import getUserStats from '../../../../../database/geoword/paid/results/get-user-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const { packetName } = req.query;
  const { buzzArray, division, leaderboard } = await getUserStats(packetName, userId);
  res.json({ buzzArray, division, leaderboard });
});

export default router;
