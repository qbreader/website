import getUserId from '../../../database/account-info/get-user-id.js';
import isStarredBonus from '../../../database/account-info/stars/is-starred-bonus.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  try {
    const bonusId = new ObjectId(req.query.bonus_id);
    res.json({ isStarred: await isStarredBonus(userId, bonusId) });
  } catch { // Invalid ObjectID
    res.json({ isStarred: false });
  }
});

export default router;
