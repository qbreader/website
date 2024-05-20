import getUserId from '../../../database/account-info/get-user-id.js';
import unstarTossup from '../../../database/account-info/stars/unstar-tossup.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  const tossupId = new ObjectId(req.body.tossup_id);
  await unstarTossup(userId, tossupId);
  res.sendStatus(200);
});

export default router;
