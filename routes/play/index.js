import geowordRouter from './geoword/index.js';
import mpRouter from './mp.js';

import { Router } from 'express';
const router = Router();

router.use('/geoword', geowordRouter);
router.use('/mp', mpRouter);

export default router;
