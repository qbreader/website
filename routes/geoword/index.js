import paidRouter from './paid/index.js';
import paymentRouter from './payment.js';

import { Router } from 'express';

const router = Router();

router.use('/admin', (req, res) => res.redirect('/admin/geoword' + req.url));
router.use('/paid', paidRouter);
router.use('/payment', paymentRouter);

export default router;
