import getUsername from '../../database/account-info/get-username.js';
import { updatePassword } from '../../server/authentication.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.post('/', async (req, res) => {
  let { user_id: userId, verifyResetPassword } = req.session;
  try { userId = new ObjectId(userId); } catch (e) { return res.sendStatus(400); }
  if (!verifyResetPassword) {
    res.sendStatus(401);
    return;
  }

  const username = await getUsername(userId);
  const password = req.body.password;
  await updatePassword(username, password);
  req.session = null;
  res.redirect(200, '/user/login');

  // console.log(`/api/auth: RESET-PASSWORD: User ${username} successfully reset their password.`);
});

export default router;
