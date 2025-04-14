import categoryStatsRouter from './category-stats.js';
import compareRouter from './compare.js';
import leaderboardRouter from './leaderboard.js';
import playerListRouter from './player-list.js';
import protestsRouter from './protests.js';
import resolveProtestRouter from './resolve-protest.js';
import statsRouter from './stats.js';

import { Router } from 'express';

const router = Router();

router.use('/category-stats', categoryStatsRouter);
router.use('/compare', compareRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/player-list', playerListRouter);
router.use('/protests', protestsRouter);
router.use('/resolve-protest', resolveProtestRouter);
router.use('/stats', statsRouter);

export default router;
