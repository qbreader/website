import getUserId from '../../../../database/account-info/get-user-id.js';
import getAllBonusStats from '../../../../database/account-info/user-stats/get-all-bonus-stats.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const stats = await getAllBonusStats(userId);
  res.json(stats);
});

export default router;
