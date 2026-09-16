import { sendResetPasswordEmail } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  await sendResetPasswordEmail(req.query.username);
  res.redirect(200, '/');
});

export default router;
