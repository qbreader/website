import getUserId from '../../../database/account-info/get-user-id.js';
import recordBuzz from '../../../database/geoword/record-buzz.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  req.query.celerity = parseFloat(req.query.celerity);
  req.query.points = parseInt(req.query.points);
  req.query.questionNumber = parseInt(req.query.questionNumber);
  if (req.query.prompts) {
    req.query.prompts = req.query.prompts.split(',');
  }

  const user_id = await getUserId(username);
  const { packetName, questionNumber, celerity, points, prompts, givenAnswer } = req.query;
  const result = await recordBuzz({ celerity, points, prompts, packetName, questionNumber, givenAnswer, user_id });

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
