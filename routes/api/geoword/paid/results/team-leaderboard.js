import getTeamLeaderboard from '../../../../../database/geoword/paid/results/get-team-leaderboard.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const teamLeaderboard = await getTeamLeaderboard({ packetName });
  res.json({ teamLeaderboard });
});

export default router;
