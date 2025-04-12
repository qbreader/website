import getUserId from '../../../../../database/account-info/get-user-id.js';
import recordBuzz from '../../../../../database/geoword/paid/play/record-buzz.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;

  req.query.celerity = parseFloat(req.query.celerity);
  req.query.points = parseInt(req.query.points);
  req.query.questionNumber = parseInt(req.query.questionNumber);
  if (req.query.prompts) {
    req.query.prompts = req.query.prompts.split(',');
  }

  const userId = await getUserId(username);
  const { celerity, givenAnswer, packetName, points, prompts, questionNumber } = req.query;
  const result = await recordBuzz({ celerity, givenAnswer, packetName, points, prompts, questionNumber, userId });

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
