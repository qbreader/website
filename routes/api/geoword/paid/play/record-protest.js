import getUserId from '../../../../../database/account-info/get-user-id.js';
import recordProtest from '../../../../../database/geoword/paid/play/record-protest.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { username } = req.session;
  req.query.questionNumber = parseInt(req.query.questionNumber);
  const { packetName, questionNumber } = req.query;
  const userId = await getUserId(username);
  const result = await recordProtest(packetName, questionNumber, userId);

  if (result.matchedCount > 0) {
    res.sendStatus(200);
  } else {
    // the buzz doesn't exist, was correct, or has already been protested
    res.sendStatus(409);
  }
});

export default router;
