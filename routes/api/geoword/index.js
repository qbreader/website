import adminRouter from './admin/index.js';
import costRouter from './cost.js';
import createPaymentIntentRouter from './create-payment-intent.js';
import getDivisionsRouter from './get-divisions.js';
import hasAdminAccessRouter from './has-admin-access.js';
import myTeamsRouter from './my-teams.js';
import packetListRouter from './packet-list.js';
import paidRouter from './paid/index.js';
import setListRouter from './set-list.js';
import teamRouter from './team/index.js';

import { Router } from 'express';

const router = Router();

router.use('/admin', adminRouter);
router.use('/cost', costRouter);
router.use('/create-payment-intent', createPaymentIntentRouter);
router.use('/get-divisions', getDivisionsRouter);
router.use('/has-admin-access', hasAdminAccessRouter);
router.use('/my-teams', myTeamsRouter);
router.use('/packet-list', packetListRouter);
router.use('/paid', paidRouter);
router.use('/set-list', setListRouter);
router.use('/team', teamRouter);

export default router;
