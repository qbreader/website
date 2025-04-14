import getCategoryLeaderboard from '../../../../../database/geoword/paid/results/get-category-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const { packetName } = req.query;
  const leaderboards = await getCategoryLeaderboard({ packetName });
  res.json({ leaderboards, username });
});

export default router;
