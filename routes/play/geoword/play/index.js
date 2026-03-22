import divisionRouter from './division.js';
import gameRouter from './game.js';

import paidMiddleware from './paid-middleware.js';

import { Router } from 'express';

const router = Router();

// only match routes that do not have a '.' in the URL
router.use(/^\/[^.]*$/, paidMiddleware);

router.use('/division', divisionRouter);
router.use('/game', gameRouter);

export default router;
