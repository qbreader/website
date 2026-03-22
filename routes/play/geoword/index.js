import paymentRouter from './payment.js';
import playRouter from './play/index.js';
import resultsRouter from './results.js';

import { Router } from 'express';

const router = Router();

router.use('/admin', (req, res) => res.redirect('/admin/geoword' + req.url));
router.use('/play', playRouter);
router.use('/payment', paymentRouter);
router.use('/results', resultsRouter);

export default router;
