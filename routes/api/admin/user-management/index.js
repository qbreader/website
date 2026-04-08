import getUser from '../../../../database/account-info/get-user.js';
import verifyEmail from './verify-email.js';

import { Router } from 'express';

const router = Router();

router.put('/verify-email', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).send('Missing username');
  }

  const user = await getUser(username);
  if (!user) {
    return res.status(404).send('User not found');
  }

  if (user.verifiedEmail) {
    return res.status(200).send('Email is already verified');
  }

  const result = await verifyEmail(user._id);
  if (result.modifiedCount > 0) {
    res.sendStatus(200);
  } else {
    res.status(500).send('Failed to verify email');
  }
});

export default router;
