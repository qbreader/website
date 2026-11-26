import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';
const router = Router();

router.use((req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.redirect('/play/geoword/login');
  }

  next();
});

export default router;
