import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';
const router = Router();

// Set-wide stats have no single packet to check payment or progress for;
// /api/geoword/set-results decides which packets the viewer can see,
// so the page only needs a logged-in user.
// only match routes that do not have a '.' in the URL
router.use(/^\/[^.]*$/, (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.redirect('/play/geoword/login');
  }

  next();
});

export default router;
