import getCategoryLeaderboard from '../../../../database/geoword/paid/results/get-category-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/category-stats', async (req, res) => {
  const { packetName, division } = req.query;
  const leaderboard = await getCategoryLeaderboard(packetName, division, true);
  res.json({ leaderboard });
});

export default router;
