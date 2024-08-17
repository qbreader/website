import audioRouter from './audio.js';
import categoryStatsRouter from './category-stats.js';
import checkAnswerRouter from './check-answer.js';
import compareRouter from './compare.js';
import costRouter from './cost.js';
import createPaymentIntentRouter from './create-payment-intent.js';
import divisionChoiceRouter from './division-choice.js';
import getDivisionsRouter from './get-divisions.js';
import getProgressRouter from './get-progress.js';
import getQuestionCountRouter from './get-question-count.js';
import leaderboardRouter from './leaderboard.js';
import packetListRouter from './packet-list.js';
import packetRouter from './packet.js';
import recordBuzzRouter from './record-buzz.js';
import recordDivisionRouter from './record-division.js';
import recordProtestRouter from './record-protest.js';
import statsRouter from './stats.js';

import { Router } from 'express';

const router = Router();

router.use('/audio', audioRouter);
router.use('/category-stats', categoryStatsRouter);
router.use('/check-answer', checkAnswerRouter);
router.use('/compare', compareRouter);
router.use('/cost', costRouter);
router.use('/create-payment-intent', createPaymentIntentRouter);
router.use('/division-choice', divisionChoiceRouter);
router.use('/get-divisions', getDivisionsRouter);
router.use('/get-progress', getProgressRouter);
router.use('/get-question-count', getQuestionCountRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/packet-list', packetListRouter);
router.use('/packet', packetRouter);
router.use('/record-buzz', recordBuzzRouter);
router.use('/record-division', recordDivisionRouter);
router.use('/record-protest', recordProtestRouter);
router.use('/stats', statsRouter);

export default router;
