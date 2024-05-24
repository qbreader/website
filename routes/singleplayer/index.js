import tossupsRouter from './tossups.js';
import bonusesRouter from './bonuses.js';

import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './client/singleplayer' });
});

router.use('/bonuses', bonusesRouter);
router.use('/tossups', tossupsRouter);

export default router;
