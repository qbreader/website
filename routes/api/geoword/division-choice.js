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
  const user_id = await getUserId(username);
  const division = await getDivisionChoice(packetName, user_id);

  res.json({ division });
});

export default router;
