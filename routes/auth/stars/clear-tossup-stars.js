import getUserId from '../../../database/account-info/get-user-id.js';
import clearTossupStars from '../../../database/account-info/stars/clear-tossup-stars.js';

import { Router } from 'express';

const router = Router();

router.delete('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  const count = await clearTossupStars(userId);
  res.status(200).json({ count });
});

export default router;
