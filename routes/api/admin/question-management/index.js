import setRouter from './set.js';

import { Router } from 'express';

const router = Router();

router.use('/set', setRouter);

export default router;
