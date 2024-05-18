import getUserId from '../../../database/account-info/get-user-id.js';
import unstarTossup from '../../../database/account-info/stars/unstar-tossup.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const user_id = await getUserId(username);
  const tossup_id = new ObjectId(req.body.tossup_id);
  await unstarTossup(user_id, tossup_id);
  res.sendStatus(200);
});

export default router;
