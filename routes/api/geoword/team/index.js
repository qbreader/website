import createRouter from './create.js';
import joinRouter from './join.js';
import leaveRouter from './leave.js';
import mineRouter from './mine.js';
import removeRouter from './remove.js';
import renameRouter from './rename.js';
import transferRouter from './transfer.js';

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
router.use('/join', joinRouter);
router.use('/leave', leaveRouter);
router.use('/mine', mineRouter);
router.use('/remove', removeRouter);
router.use('/rename', renameRouter);
router.use('/transfer', transferRouter);

export default router;
