import getUser from '../../../../../database/account-info/get-user.js';
import getBuzzCount from '../../../../../database/geoword/get-buzz-count.js';
import getQuestionCount from '../../../../../database/geoword/get-question-count.js';

import categoryStatsRouter from './category-stats.js';
import compareRouter from './compare.js';
import leaderboardRouter from './leaderboard.js';
import packetRouter from './packet.js';
import statsRouter from './stats.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
  const { username } = req.session;
  const { packetName } = req.query;
  const user = await getUser(username);

  const [buzzCount, questionCount] = await Promise.all([
    getBuzzCount(packetName, user._id),
    getQuestionCount(packetName)
  ]);

  if (!user.admin && buzzCount < questionCount) {
    res.status(403).send('You must finish the game before viewing results.');
    return;
  }

  next();
});

router.use('/category-stats', categoryStatsRouter);
router.use('/compare', compareRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/packet', packetRouter);
router.use('/stats', statsRouter);

export default router;
