import mpRouter from './mp.js';

import { Router } from 'express';
const router = Router();

router.use('/mp', mpRouter);

export default router;
