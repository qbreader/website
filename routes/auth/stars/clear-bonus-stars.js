import getUserId from '../../../database/account-info/get-user-id.js';
import clearBonusStars from '../../../database/account-info/stars/clear-bonus-stars.js';

import { Router } from 'express';

const router = Router();

router.delete('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  const count = await clearBonusStars(userId);
  res.status(200).json({ count });
});

export default router;
