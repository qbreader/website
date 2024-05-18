import getUserId from '../../../database/account-info/get-user-id.js';
import isStarredBonus from '../../../database/account-info/stars/is-starred-bonus.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const user_id = await getUserId(username);
  try {
    const bonus_id = new ObjectId(req.query.bonus_id);
    res.json({ isStarred: await isStarredBonus(user_id, bonus_id) });
  } catch { // Invalid ObjectID
    res.json({ isStarred: false });
  }
});

export default router;
