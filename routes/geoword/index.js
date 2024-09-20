import categoryStatsRouter from './category-stats.js';
import compareRouter from './compare.js';
import divisionRouter from './division.js';
import gameRouter from './game.js';
import packetRouter from './packet.js';
import paymentRouter from './payment.js';
import statsRouter from './stats.js';

import isAdmin from '../../database/account-info/is-admin.js';
import getPacketStatus from '../../database/geoword/get-packet-status.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './client/geoword' });
});

router.use('/admin', (req, res) => {
  res.redirect('/admin/geoword' + req.url);
});

router.get('/confirmation', (req, res) => {
  res.sendFile('confirmation.html', { root: './client/geoword' });
});

router.get('/index', (req, res) => {
  res.redirect('/geoword');
});

router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: './client/geoword' });
});

router.use('/*/:packetName', async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.redirect('/geoword/login');
    return;
  }

  const packetName = req.params.packetName;
  const status = await getPacketStatus(packetName);

  if (status === null) {
    res.redirect('/geoword');
    return;
  }

  const admin = await isAdmin(username);
  if (status === false && !admin) {
    res.redirect('/geoword');
    return;
  }

  next();
});

router.use('/category-stats', categoryStatsRouter);
router.use('/compare', compareRouter);
router.use('/division', divisionRouter);
router.use('/game', gameRouter);

router.get('/leaderboard/:packetName', (req, res) => {
  res.sendFile('leaderboard.html', { root: './client/geoword' });
});

router.use('/packet', packetRouter);
router.use('/payment', paymentRouter);
router.use('/stats', statsRouter);

export default router;
