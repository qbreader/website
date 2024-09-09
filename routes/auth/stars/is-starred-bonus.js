import getUserId from '../../../database/account-info/get-user-id.js';
import isStarredBonus from '../../../database/account-info/stars/is-starred-bonus.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let bonusId;
  try { bonusId = new ObjectId(req.query.bonus_id); } catch { return res.status(400).send('Invalid Bonus ID'); }
  res.json({ isStarred: await isStarredBonus(userId, bonusId) });
});

export default router;
