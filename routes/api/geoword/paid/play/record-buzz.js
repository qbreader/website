import getUserId from '../../../../../database/account-info/get-user-id.js';
import recordBuzz from '../../../../../database/geoword/paid/play/record-buzz.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;

  req.query.celerity = Math.min(1, Math.max(0, parseFloat(req.query.celerity) || 0));
  req.query.isCorrect = req.query.isCorrect === 'true';
  if (req.query.prompts) {
    req.query.prompts = req.query.prompts.split(',');
  }

  const userId = await getUserId(username);
  const { celerity, division, givenAnswer, isCorrect, packetName, prompts, questionNumber } = req.query;
  const result = await recordBuzz({ celerity, division, givenAnswer, isCorrect, packetName, prompts, questionNumber, userId });

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
