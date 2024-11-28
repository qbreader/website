import { COOKIE_MAX_AGE } from '../../constants.js';
import getUser from '../../database/account-info/get-user.js';
import createUser from '../../database/account-info/create-user.js';
import { generateToken, saltAndHashPassword, sendVerificationEmail, validateUsername } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const username = req.body.username;

  // return error if username already exists
  const results = await getUser(username);
  if (results) {
    // console.log(`/api/auth: SIGNUP: User ${username} failed to sign up. That username is taken.`);
    res.sendStatus(409);
    return;
  }

  if (!validateUsername(username)) {
    // console.log(`/api/auth: SIGNUP: User ${username} failed to sign up. That username is invalid.`);
    res.sendStatus(400);
    return;
  }

  // log the user in when they sign up
  const expires = Date.now() + COOKIE_MAX_AGE;
  req.session.username = username;
  req.session.token = generateToken(username);
  req.session.expires = expires;

  const password = saltAndHashPassword(req.body.password);
  const email = req.body.email;
  await createUser(username, password, email);
  sendVerificationEmail(username);
  // console.log(`/api/auth: SIGNUP: User ${username} successfully signed up.`);
  res.status(200).send(JSON.stringify({ expires }));
});

export default router;
