import getUserId from '../../../database/account-info/get-user-id.js';
import isStarredTossup from '../../../database/account-info/stars/is-starred-tossup.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let tossupId;
  try { tossupId = new ObjectId(req.query.tossup_id); } catch { return res.status(400).send('Invalid Tossup ID'); }
  res.json({ isStarred: await isStarredTossup(userId, tossupId) });
});

export default router;
