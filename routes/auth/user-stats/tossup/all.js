import getUserId from '../../../../database/account-info/get-user-id.js';
import getAllTossupStats from '../../../../database/account-info/user-stats/get-all-tossup-stats.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const stats = await getAllTossupStats(userId);
  res.json(stats);
});

export default router;
