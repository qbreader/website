import getUserId from '../../../database/account-info/get-user-id.js';
import isStarredTossup from '../../../database/account-info/stars/is-starred-tossup.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  try {
    const tossupId = new ObjectId(req.query.tossup_id);
    res.json({ isStarred: await isStarredTossup(userId, tossupId) });
  } catch { // Invalid ObjectID
    res.json({ isStarred: false });
  }
});

export default router;
