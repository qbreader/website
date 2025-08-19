import queryRedirect from '../server/query-redirect.js';

import { Router } from 'express';
const router = Router();

/**
 * Redirects:
 */
router.get('/bonuses', (_req, res) => res.redirect('/singleplayer/bonuses'));
router.get('/database', queryRedirect('/db/'));
router.get('/frequency-list', queryRedirect('/db/frequency-list/'));
router.get('/frequency-list/subcategory', queryRedirect('/db/frequency-list/subcategory'));
router.get('/tools/db-explorer/:param', (req, res) => queryRedirect('/db/explorer/' + req.params.param)(req, res));
router.get('/tossups', (_req, res) => res.redirect('/singleplayer/tossups'));
router.get('/user', (_req, res) => res.redirect('/user/login'));

export default router;
