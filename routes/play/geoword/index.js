import divisionRouter from './division.js';
import gameRouter from './game.js';
import paymentRouter from './payment.js';
import resultsRouter from './results.js';

import { Router } from 'express';

const router = Router();

router.use('/admin', (req, res) => res.redirect('/admin/geoword' + req.url));
router.use('/division', divisionRouter);
router.use('/game', gameRouter);
router.use('/payment', paymentRouter);
router.use('/results', resultsRouter);

export default router;
