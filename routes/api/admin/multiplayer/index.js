import roomListRouter from './room-list.js';
import toggleRoomLockRouter from './toggle-room-lock.js';

import { Router } from 'express';
const router = Router();

router.use('/room-list', roomListRouter);
router.use('/toggle-room-lock', toggleRoomLockRouter);

export default router;
