import getLeaderboard from '../../../../database/geoword/paid/results/get-leaderboard.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query.includeInactive = req.query.includeInactive === 'true';
  const { packetName, includeInactive } = req.query;
  const leaderboard = await getLeaderboard({ packetName, includeInactive });
  res.json({ leaderboard });
});

export default router;
