import bonusRouter from './bonus/index.js';
import tossupRouter from './tossup/index.js';

import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.use((req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  if (!checkToken(username, token, true)) {
    res.sendStatus(403);
    return;
  }

  if (req.query.difficulties) {
    req.query.difficulties = req.query.difficulties
      .split(',')
      .map((difficulty) => parseInt(difficulty));
  }

  req.query.includeMultiplayer = !(req.query.includeMultiplayer === 'false');
  req.query.includeSingleplayer = !(req.query.includeSingleplayer === 'false');
  req.query.startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  req.query.endDate = req.query.endDate ? new Date(req.query.endDate) : null;
  // note that isNaN(null) === true
  if (isNaN(req.query.startDate) || isNaN(req.query.endDate)) {
    res.sendStatus(400);
    return;
  }

  next();
});

router.use('/bonus', bonusRouter);
router.use('/tossup', tossupRouter);

export default router;
