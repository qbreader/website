import getCategoryLeaderboard from '../../../../database/geoword/paid/results/get-category-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const leaderboards = await getCategoryLeaderboard({ packetName, includeInactive: true });
  res.json({ leaderboards });
});

export default router;
