import tossupsRouter from './tossups/index.js';

import { Router } from 'express';
const router = Router();

router.use('/tossups', tossupsRouter);

export default router;
