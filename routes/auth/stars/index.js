import bonusesRouter from './bonuses.js';
import isStarredBonusRouter from './is-starred-bonus.js';
import isStarredTossupRouter from './is-starred-tossup.js';
import starBonusRouter from './star-bonus.js';
import starTossupRouter from './star-tossup.js';
import tossupsRouter from './tossups.js';
import unstarBonusRouter from './unstar-bonus.js';
import unstarTossupRouter from './unstar-tossup.js';

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

  next();
});

router.use('/bonuses', bonusesRouter);
router.use('/is-starred-bonus', isStarredBonusRouter);
router.use('/is-starred-tossup', isStarredTossupRouter);
router.use('/star-bonus', starBonusRouter);
router.use('/star-tossup', starTossupRouter);
router.use('/tossups', tossupsRouter);
router.use('/unstar-bonus', unstarBonusRouter);
router.use('/unstar-tossup', unstarTossupRouter);

export default router;
