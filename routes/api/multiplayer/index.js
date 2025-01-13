import roomListRouter from './room-list.js';

import { Router } from 'express';

const router = Router();

router.use('/room-list', roomListRouter);

export default router;
