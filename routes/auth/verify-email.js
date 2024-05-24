import { verifyEmailLink } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { user_id: userId, token } = req.query;
  const verified = verifyEmailLink(userId, token);

  if (verified) {
    req.session = null;
    res.redirect('/user/login');
  } else {
    res.redirect('/user/verify-failed');
  }
});

export default router;
