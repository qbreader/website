import queryRedirect from '../server/query-redirect.js';

import { Router } from 'express';
const router = Router();

/**
 * Redirects:
 */
router.get('/bonuses', (_req, res) => res.redirect('/play/bonuses/solo/'));
router.get('/multiplayer', (_req, res) => res.redirect('/play/tossups/mp'));
router.get('/multiplayer/:param', (req, res) => queryRedirect(res.redirect('/play/tossups/mp/' + req.params.param))(req, res));
router.get('/singleplayer', (_req, res) => res.redirect('/play/'));
router.get('/singleplayer/bonuses', (_req, res) => res.redirect('/play/bonuses/solo/'));
router.get('/singleplayer/tossups', (_req, res) => res.redirect('/play/tossups/solo/'));
router.get('/tossups', (_req, res) => res.redirect('/play/tossups/solo/'));

router.get('/database', queryRedirect('/db/'));
router.get('/frequency-list', queryRedirect('/db/frequency-list/'));
router.get('/frequency-list/subcategory', queryRedirect('/db/frequency-list/subcategory'));
router.get('/tools/db-explorer/:param', (req, res) => queryRedirect('/db/explorer/' + req.params.param)(req, res));

router.get('/user', (_req, res) => res.redirect('/user/login'));

export default router;
