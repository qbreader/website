import getUserId from '../../../database/account-info/get-user-id.js';
import getDivisionChoice from '../../../database/geoword/get-division-choice.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.redirect('/geoword/login');
    return;
  }

  const { packetName } = req.query;
  const userId = await getUserId(username);
  const division = await getDivisionChoice(packetName, userId);

  res.json({ division });
});

export default router;
