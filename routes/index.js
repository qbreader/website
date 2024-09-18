import aboutRouter from './about/index.js';
import adminRouter from './admin/index.js';
import apiRouter from './api/index.js';
import apiDocsRouter from './api-docs.js';
import authRouter from './auth/index.js';
import backupsRouter from './backups.js';
import databaseRouter from './database.js';
import frequencyListRouter from './frequency-list.js';
import geowordRouter from './geoword/index.js';
import multiplayerRouter from './multiplayer.js';
import settingsRouter from './settings.js';
import singleplayerRouter from './singleplayer/index.js';
import userRouter from './user.js';
import webhookRouter from './api/webhook.js';

import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './client' });
});

router.get('/react(-dom)?/umd/*.js', (req, res) => {
  res.sendFile(req.url, { root: './node_modules' });
});

router.get('/react-highlight-words/build/static/*.js', (req, res) => {
  res.sendFile(req.url, { root: './node_modules' });
});

router.get('/node_modules/*.scss', (req, res) => {
  res.sendFile(req.url.substring(13), { root: './node_modules' });
});

router.get('/*.css', (req, res) => {
  res.sendFile(req.url, { root: './client' });
});

router.get('/*.ico', (req, res) => {
  res.sendFile(req.url, { root: './client' });
});

router.get('/*.js', (req, res) => {
  res.sendFile(req.url, { root: './client' });
});

router.get('/*.jsx', (req, res) => {
  res.sendFile(req.url, { root: './client' });
});

router.get('/*.map', (req, res) => {
  res.sendFile(req.url, { root: './client' });
});

router.get('/*.png', (req, res) => {
  res.sendFile(req.url, { root: './client' });
});

router.get('/*.scss', (req, res) => {
  res.sendFile(req.url.substring(5), { root: './scss' });
});

/**
 * Redirects:
 */
router.get('/*.html', (req, res) => {
  res.redirect(req.url.substring(0, req.url.length - 5));
});

router.get('/api-info', (req, res) => {
  res.redirect('/api-docs');
});

router.get('/bonuses', (_req, res) => {
  res.redirect('/singleplayer/bonuses');
});

router.get('/database', (_req, res) => {
  res.redirect('/db');
});

router.get('/index', (req, res) => {
  res.redirect('/');
});

router.get('/tossups', (req, res) => {
  res.redirect('/singleplayer/tossups');
});

router.get('/users', (req, res) => {
  res.redirect(`/user${req.url}`);
});

/**
 * Routes:
 */

router.use('/about', aboutRouter);
router.use('/admin', adminRouter);
router.use('/api', apiRouter);
router.use('/api-docs', apiDocsRouter);
router.use('/auth', authRouter);
router.use('/backups', backupsRouter);
router.use('/db', databaseRouter);
router.use('/frequency-list', frequencyListRouter);
router.use('/geoword', geowordRouter);
router.use('/multiplayer', multiplayerRouter);
router.use('/settings', settingsRouter);
router.use('/singleplayer', singleplayerRouter);
router.use('/user', userRouter);
router.use('/webhook', webhookRouter);

router.use((req, res) => {
  res.sendFile(req.url, { root: './client' });
});

export default router;
