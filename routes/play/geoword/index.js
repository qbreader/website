import adminRouter from './admin.js';
import divisionRouter from './division.js';
import gameRouter from './game.js';
import paymentRouter from './payment.js';
import resultsRouter from './results.js';
import setResultsRouter from './set-results.js';

import { Router } from 'express';

const router = Router();

router.use('/admin', adminRouter);
router.use('/division', divisionRouter);
router.use('/game', gameRouter);
router.use('/payment', paymentRouter);
router.use('/results', resultsRouter);
router.use('/set-results', setResultsRouter);

export default router;
