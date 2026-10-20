import createRouter from './create.js';
import joinRouter from './join.js';
import leaveRouter from './leave.js';
import mineRouter from './mine.js';
import removeRouter from './remove.js';
import renameRouter from './rename.js';
import transferRouter from './transfer.js';

import getUserId from '../../../../database/account-info/get-user-id.js';
import getSet from '../../../../database/geoword/get-set.js';
import { checkToken } from '../../../../server/authentication.js';
import validate, { rules } from '../../../validators/schema.js';

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

// Every team route acts within one set, named by `setName` in the body or query.
router.use(async (req, res, next) => {
  const { setName } = validate({ setName: req.body?.setName ?? req.query.setName }, { setName: rules.string() });
  res.locals.set = await getSet(setName);
  if (!res.locals.set) {
    return res.status(404).send('That set does not exist.');
  }

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
