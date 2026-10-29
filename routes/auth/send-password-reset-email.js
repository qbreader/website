import { resolveLoginIdentifier, sendResetPasswordEmail } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const identifier = req.query.username;
  if (typeof identifier !== 'string') {
    res.sendStatus(400);
    return;
  }

  // response is the same whether or not the account exists, so it cannot be used to probe for emails
  await sendResetPasswordEmail(await resolveLoginIdentifier(identifier));
  res.redirect(200, '/');
});

export default router;
