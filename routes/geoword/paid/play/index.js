import divisionRouter from './division.js';
import gameRouter from './game.js';

import { Router } from 'express';

const router = Router();

router.use('/division', divisionRouter);
router.use('/game', gameRouter);

export default router;
