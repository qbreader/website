import { verifyResetPasswordLink } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { user_id: userId, token } = req.query;
  const verified = verifyResetPasswordLink(userId, token);
  if (verified) {
    req.session.user_id = userId;
    req.session.verifyResetPassword = true;
    res.redirect('/user/reset-password');
  } else {
    res.redirect('/user/verify-failed');
  }
});

export default router;
