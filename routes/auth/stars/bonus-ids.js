import getUserId from '../../../database/account-info/get-user-id.js';
import getBonusIds from '../../../database/account-info/stars/get-ids-bonus.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  const ids = await getBonusIds(userId);
  res.json(ids);
});

export default router;
