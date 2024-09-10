import isAdmin from '../../database/account-info/is-admin.js';
import { checkToken } from '../../server/authentication.js';

import categoryReportsRouter from './category-reports.js';
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
    res.redirect('/user/login');
    return;
  }

  next();
});

router.use('/category-reports', categoryReportsRouter);
router.use('/geoword', geowordRouter);

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './client/admin' });
});

export default router;
