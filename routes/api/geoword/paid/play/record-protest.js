import getUserId from '../../../../../database/account-info/get-user-id.js';
import recordProtest from '../../../../../database/geoword/paid/play/record-protest.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { username } = req.session;
  const { packetName, questionNumber } = req.query;
  const userId = await getUserId(username);
  const result = await recordProtest(packetName, questionNumber, userId);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
