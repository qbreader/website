import getUserId from '../../../database/account-info/get-user-id.js';
import recordProtest from '../../../database/geoword/record-protest.js';
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

  const { packetName, questionNumber } = req.body;
  const userId = await getUserId(username);
  const result = await recordProtest(packetName, questionNumber, userId);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
