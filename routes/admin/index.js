import isAdmin from '../../database/account-info/is-admin.js';
import { checkToken } from '../../server/authentication.js';

import geowordRouter from './geoword.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.redirect('/user/login?' + encodeURIComponent(req.originalUrl));
    return;
  }

  const admin = await isAdmin(username);
  if (!admin) {
    return res.redirect('/user/login');
  }

  next();
});

router.use('/geoword', geowordRouter);

export default router;
