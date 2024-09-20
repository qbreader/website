import getUserId from '../../../database/account-info/get-user-id.js';
import unstarBonus from '../../../database/account-info/stars/unstar-bonus.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let bonusId;
  try { bonusId = new ObjectId(req.body.bonus_id); } catch { return res.status(400).send('Invalid Bonus ID'); }
  await unstarBonus(userId, bonusId);
  res.sendStatus(200);
});

export default router;
