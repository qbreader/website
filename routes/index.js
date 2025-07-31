import adminRouter from './admin.js';
import apiRouter from './api/index.js';
import authRouter from './auth/index.js';
import dbRouter from './db.js';
import geowordRouter from './geoword/index.js';
import multiplayerRouter from './multiplayer.js';
import userRouter from './user.js';

import redirectsRouter from './redirects.js';

import cors from 'cors';
import express, { Router } from 'express';
const router = Router();

router.get('/*.scss', (req, res) => res.sendFile(req.url, { root: './scss' }));

router.use(redirectsRouter);

/**
 * Routes:
 */
router.use('/admin', adminRouter);
router.use('/api', cors(), apiRouter);
router.use('/auth', authRouter);
router.use('/db', dbRouter);
router.use('/geoword', geowordRouter);
router.use('/multiplayer', multiplayerRouter);
router.use('/user', userRouter);

router.use('/quizbowl', express.static('quizbowl'));

router.use(express.static('client', { extensions: ['html'] }));
router.use(express.static('node_modules'));

/**
 * 404 Error handler
 */
router.use((_req, res) => {
  res.sendFile('404.html', { root: './client' });
});

export default router;
