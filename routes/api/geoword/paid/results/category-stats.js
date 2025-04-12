import getUserId from '../../../../../database/account-info/get-user-id.js';
import getCategoryLeaderboard from '../../../../../database/geoword/paid/results/get-category-stats.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;

  const userId = await getUserId(username);
  const { packetName } = req.query;
  const division = await getDivisionChoice(packetName, userId);
  const leaderboard = await getCategoryLeaderboard(packetName, division);
  res.json({ division, leaderboard, username });
});

export default router;
