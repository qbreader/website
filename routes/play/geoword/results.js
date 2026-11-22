import paidMiddleware from './paid-middleware.js';
import getUser from '../../../database/account-info/get-user.js';
import hasPacketPrivileges from '../../../database/geoword/has-packet-privileges.js';
import getBuzzCount from '../../../database/geoword/get-buzz-count.js';
import getQuestionCount from '../../../database/geoword/get-question-count.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';
const router = Router();

// Set-wide stats pages have no packet to check payment or progress for;
// /api/geoword/set-results decides which packets the viewer can see
router.use(/^\/[^.]*$/, (req, res, next) => {
  if (req.query.packetName !== undefined || req.query.setName === undefined) { return next(); }

  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.redirect('/play/geoword/login');
  }
  next('router');
});

router.use(/^\/[^.]*$/, paidMiddleware);

// only match routes that do not have a '.' in the URL
router.use(/^\/[^.]*$/, async (req, res, next) => {
  const { username } = req.session;
  const { packetName } = req.query;
  const user = await getUser(username);

  const [privileged, buzzCount, questionCount] = await Promise.all([
    hasPacketPrivileges(packetName, user?._id),
    getBuzzCount(packetName, user?._id),
    getQuestionCount(packetName)
  ]);

  if (!privileged && buzzCount < questionCount) {
    return res.status(403).send('You must finish the game before viewing results.');
  }

  next();
});

export default router;
