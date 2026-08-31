import adminRouter from './admin.js';
import apiRouter from './api/index.js';
import authRouter from './auth/index.js';
import dbRouter from './db/index.js';
import playRouter from './play/index.js';
import userRouter from './user.js';

import redirectsRouter from './redirects.js';
import ssiMiddleware, { replaceSSI } from './ssi-middleware.js';

import cors from 'cors';
import express, { Router } from 'express';
import fs from 'fs';
const router = Router();

router.get('/*.scss', (req, res) => res.sendFile(req.url, { root: './scss' }));

router.use(redirectsRouter);

router.get('/health', (req, res) => res.sendStatus(200));

/**
 * Routes:
 */
router.use('/admin', adminRouter);
router.use('/api', cors(), apiRouter);
router.use('/auth', authRouter);
router.use('/db', dbRouter);
router.use('/play', playRouter);
router.use('/user', userRouter);

router.use('/shared', express.static('shared'));

router.use(ssiMiddleware);
router.use(express.static('client', { extensions: ['html'] }));
router.use(express.static('node_modules'));

/**
 * 404 Error handler
 */
const notFoundPage = replaceSSI(fs.readFileSync('./client/404.html', 'utf8'));
router.use((_req, res) => res.status(404).send(notFoundPage));

export default router;
