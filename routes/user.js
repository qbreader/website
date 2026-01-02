import { checkToken } from '../server/authentication.js';

import { Router } from 'express';
const router = Router();

function getPageSecurely (req, res, next) {
  // don't show page if you're not logged in
  if (!req.session || !checkToken(req.session.username, req.session.token)) {
    return res.redirect('/user/login?' + encodeURIComponent(req.originalUrl));
  }
  next(); // rely on express.static to serve the file
}

router.get('/login', (req, res, next) => {
  // don't show login page if you're already logged in
  if (req.session && checkToken(req.session.username, req.session.token)) {
    return res.redirect('/user/');
  }
  next();
});

router.get('/', getPageSecurely);
router.get('/edit-profile', getPageSecurely);
router.get('/edit-password', getPageSecurely);
router.get('/stars/bonuses', getPageSecurely);
router.get('/stars/tossups', getPageSecurely);
router.get('/stats/bonus/', getPageSecurely);
router.get('/stats/bonus/graph', getPageSecurely);
router.get('/stats/tossup/', getPageSecurely);
router.get('/stats/tossup/graph', getPageSecurely);

export default router;
