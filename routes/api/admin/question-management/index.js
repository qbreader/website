import packetRouter from './packet.js';
import setRouter from './set.js';

import { Router } from 'express';

const router = Router();

router.use('/packet', packetRouter);
router.use('/set', setRouter);

export default router;
