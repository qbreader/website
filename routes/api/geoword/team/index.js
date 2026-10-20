import createRouter from './create.js';
import mineRouter from './mine.js';

import getUserId from '../../../../database/account-info/get-user-id.js';
import { checkToken } from '../../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.sendStatus(401);
  }

  res.locals.userId = await getUserId(username);
  next();
});

router.use('/create', createRouter);
router.use('/mine', mineRouter);

export default router;
