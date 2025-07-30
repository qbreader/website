import bonusRouter from './bonus.js';
import tossupRouter from './tossup.js';

import { Router } from 'express';

const router = Router();

router.use('/bonus', bonusRouter);
router.use('/tossup', tossupRouter);

export default router;
