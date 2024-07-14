import recordBonusData from '../../../database/account-info/question-stats/record-bonus-data.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  if (!checkToken(username, token, true)) {
    res.sendStatus(403);
    return;
  }

  const results = await recordBonusData(username, req.body);
  res.json(results);
});

export default router;
