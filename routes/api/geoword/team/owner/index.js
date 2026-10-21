import removeRouter from './remove.js';
import renameRouter from './rename.js';
import transferRouter from './transfer.js';

import getTeam from '../../../../../database/geoword/get-team.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
  const team = await getTeam(res.locals.set._id, res.locals.userId);
  if (!team) {
    return res.sendStatus(404);
  }
  if (!team.owner?.equals(res.locals.userId)) {
    return res.status(403).send('Only the team owner can do that.');
  }

  next();
});

router.use('/remove', removeRouter);
router.use('/rename', renameRouter);
router.use('/transfer', transferRouter);

export default router;
