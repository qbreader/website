import getUserId from '../../../database/account-info/get-user-id.js';
import recordDivision from '../../../database/geoword/record-division.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  const { packetName, division } = req.body;
  const user_id = await getUserId(username);
  const result = await recordDivision(packetName, division, user_id);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
