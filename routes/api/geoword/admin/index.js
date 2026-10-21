import categoryStatsRouter from './category-stats.js';
import compareRouter from './compare.js';
import invoiceRouter from './invoice.js';
import leaderboardRouter from './leaderboard.js';
import paymentsListRouter from './payment-list.js';
import packetListRouter from './packet-list.js';
import playerListRouter from './player-list.js';
import protestsRouter from './protests.js';
import publishedRouter from './published.js';
import recordPaymentrouter from './record-payment.js';
import resolveProtestRouter from './resolve-protest.js';
import statsRouter from './stats.js';
import teamListRouter from './team-list.js';
import teamRouter from './team.js';

import getUserId from '../../../../database/account-info/get-user-id.js';
import hasAnyPacketPrivileges from '../../../../database/geoword/has-any-packet-privileges.js';
import hasPacketPrivileges from '../../../../database/geoword/has-packet-privileges.js';
import { checkToken } from '../../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

const PACKETLESS_PATHS = ['/packet-list'];

router.use(async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.sendStatus(401);
  }

  const userId = await getUserId(username);
  const packetName = req.query.packetName ?? req.body?.packetName;

  if (packetName === undefined && !PACKETLESS_PATHS.includes(req.path)) {
    return res.sendStatus(400);
  }

  const allowed = packetName === undefined
    ? await hasAnyPacketPrivileges(userId)
    : await hasPacketPrivileges(packetName, userId);

  if (!allowed) {
    return res.sendStatus(403);
  }

  res.locals.userId = userId;
  next();
});

router.use('/category-stats', categoryStatsRouter);
router.use('/compare', compareRouter);
router.use('/invoice', invoiceRouter);
router.use('/leaderboard', leaderboardRouter);
router.use('/packet-list', packetListRouter);
router.use('/payment-list', paymentsListRouter);
router.use('/player-list', playerListRouter);
router.use('/protests', protestsRouter);
router.use('/published', publishedRouter);
router.use('/record-payment', recordPaymentrouter);
router.use('/resolve-protest', resolveProtestRouter);
router.use('/stats', statsRouter);
router.use('/team', teamRouter);
router.use('/team-list', teamListRouter);

export default router;
