import getUserId from '../../../../../database/account-info/get-user-id.js';
import getTeamLeaderboard from '../../../../../database/geoword/paid/results/get-team-leaderboard.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const viewerId = await getUserId(req.session.username);
  const teamLeaderboard = await getTeamLeaderboard({ packetName, viewerId });
  res.json({ teamLeaderboard });
});

export default router;
