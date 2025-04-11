import getUserId from '../../../../database/account-info/get-user-id.js';
import getBuzzCount from '../../../../database/geoword/get-buzz-count.js';
import getDivisionChoice from '../../../../database/geoword/get-division-choice.js';
import getQuestionCount from '../../../../database/geoword/get-question-count.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res, next) => {
  const { username } = req.session;
  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const divisionChoice = await getDivisionChoice(packetName, userId);

  if (!divisionChoice) {
    return res.redirect(`/geoword/paid/play/division?packetName=${packetName}`);
  }

  const [buzzCount, questionCount] = await Promise.all([
    getBuzzCount(packetName, userId),
    getQuestionCount(packetName, divisionChoice)
  ]);

  if (buzzCount >= questionCount) {
    return res.redirect(`/geoword/paid/results/stats?packetName=${packetName}`);
  }

  next();
});

export default router;
