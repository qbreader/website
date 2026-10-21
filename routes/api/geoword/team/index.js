import createRouter from './create.js';
import joinRouter from './join.js';
import leaveRouter from './leave.js';
import mineRouter from './mine.js';
import requireOwnerRouter from './require-owner/index.js';

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
router.use(requireOwnerRouter);

export default router;
