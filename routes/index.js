import adminRouter from './admin/index.js';
import apiRouter from './api/index.js';
import authRouter from './auth/index.js';
import geowordRouter from './geoword/index.js';
import multiplayerRouter from './multiplayer.js';
import userRouter from './user.js';
import webhookRouter from './api/webhook.js';

import express, { Router } from 'express';
const router = Router();

router.get('/*.scss', (req, res) => {
  res.sendFile(req.url, { root: './scss' });
});

/**
 * Redirects:
 */
router.get('/api-info', (_req, res) => res.redirect('/api-docs'));
router.get('/bonuses', (_req, res) => res.redirect('/singleplayer/bonuses'));
router.get('/db', (_req, res) => res.redirect('/database'));
router.get('/tossups', (_req, res) => res.redirect('/singleplayer/tossups'));
router.get('/user', (_req, res) => res.redirect('/user/login'));

/**
 * Routes:
 */
router.use('/admin', adminRouter);
router.use('/api', apiRouter);
router.use('/auth', authRouter);
router.use('/geoword', geowordRouter);
router.use('/multiplayer', multiplayerRouter);
router.use('/user', userRouter);
router.use('/webhook', webhookRouter);

router.use(express.static('client', { extensions: ['html'] }));
router.use(express.static('quizbowl'));
router.use(express.static('node_modules'));

/**
 * 404 Error handler
 */
router.use((_req, res) => {
  res.sendFile('404.html', { root: './client' });
});

export default router;
