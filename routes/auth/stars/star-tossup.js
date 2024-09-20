import getUserId from '../../../database/account-info/get-user-id.js';
import starTossup from '../../../database/account-info/stars/star-tossup.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let tossupId;
  try { tossupId = new ObjectId(req.body.tossup_id); } catch { return res.status(400).send('Invalid Tossup ID'); }
  await starTossup(userId, tossupId);
  res.sendStatus(200);
});

export default router;
