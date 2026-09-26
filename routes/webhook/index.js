import mailersendRouter from './mailersend.js';
import { Router } from 'express';

const router = Router();

router.use('/mailersend', mailersendRouter);

export default router;
