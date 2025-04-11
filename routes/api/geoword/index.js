import costRouter from './cost.js';
import createPaymentIntentRouter from './create-payment-intent.js';
import getDivisionsRouter from './get-divisions.js';
import packetListRouter from './packet-list.js';
import paidRouter from './paid/index.js';

import { Router } from 'express';

const router = Router();

router.use('/cost', costRouter);
router.use('/create-payment-intent', createPaymentIntentRouter);
router.use('/get-divisions', getDivisionsRouter);
router.use('/packet-list', packetListRouter);
router.use('/paid', paidRouter);

export default router;
