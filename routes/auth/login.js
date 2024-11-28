import { COOKIE_MAX_AGE } from '../../constants.js';
import getUserField from '../../database/account-info/get-user-field.js';
import { checkPassword, generateToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (await checkPassword(username, password)) {
    const expires = Date.now() + COOKIE_MAX_AGE;
    const verifiedEmail = await getUserField(username, 'verifiedEmail');
    req.session.username = username;
    req.session.token = generateToken(username, verifiedEmail);
    req.session.expires = expires;
    // console.log(`/api/auth: LOGIN: User ${username} successfully logged in.`);
    res.status(200).send(JSON.stringify({ expires }));
  } else {
    // console.log(`/api/auth: LOGIN: User ${username} failed to log in.`);
    res.sendStatus(401);
  }
});

export default router;
