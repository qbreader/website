import { COOKIE_MAX_AGE } from '../../server/constants.js';
import getUserField from '../../database/account-info/get-user-field.js';
import { checkPassword, generateToken, resolveLoginIdentifier } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { username: identifier, password } = req.body;
  if (typeof identifier !== 'string') {
    res.sendStatus(400);
    return;
  }

  // email is not stored but it can be used as an identifier
  const username = await resolveLoginIdentifier(identifier);
  if (await checkPassword(username, password)) {
    const expires = Date.now() + COOKIE_MAX_AGE;
    const verifiedEmail = await getUserField(username, 'verifiedEmail');
    req.session.username = username;
    req.session.token = generateToken(username, verifiedEmail);
    req.session.expires = expires;
    // console.log(`/api/auth: LOGIN: User ${username} successfully logged in.`);
    res.status(200).send(JSON.stringify({ expires, username }));
  } else {
    // console.log(`/api/auth: LOGIN: User ${username} failed to log in.`);
    res.sendStatus(401);
  }
});

export default router;
