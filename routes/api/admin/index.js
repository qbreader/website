import clearReportsRouter from './clear-reports.js';
import geowordRouter from './geoword/index.js';
import listReportsRouter from './list-reports.js';
import leaderboardRouter from './leaderboard.js';
import questionManagementRouter from './question-management/index.js';
import updateSubcategoryRouter from './update-subcategory.js';

import isAdmin from '../../../database/account-info/is-admin.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.redirect('/geoword/login');
    return;
  }

  const admin = await isAdmin(username);
  if (!admin) {
    res.status(403).redirect('/user/my-profile');
    return;
  }

  next();
});

router.use('/clear-reports', clearReportsRouter);
router.use('/geoword', geowordRouter);
router.use('/list-reports', listReportsRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/question-management', questionManagementRouter);
router.use('/update-subcategory', updateSubcategoryRouter);

export default router;
