import getUserId from '../../database/account-info/get-user-id.js';
import checkPayment from '../../database/geoword/check-payment.js';
import getBuzzCount from '../../database/geoword/get-buzz-count.js';
import getDivisionChoice from '../../database/geoword/get-division-choice.js';
import getQuestionCount from '../../database/geoword/get-question-count.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
  const { username } = req.session;
  const packetName = req.params.packetName;
  const userId = await getUserId(username);

  const division = await getDivisionChoice(packetName, userId);

  if (!division) {
    res.redirect('/geoword/division/' + packetName);
    return;
  }

  const paid = await checkPayment(packetName, userId);

  if (!paid) {
    res.redirect('/geoword/payment/' + packetName);
    return;
  }

  const [buzzCount, questionCount] = await Promise.all([
    getBuzzCount(packetName, userId),
    getQuestionCount(packetName, division)
  ]);

  if (buzzCount >= questionCount) {
    res.redirect('/geoword/stats/' + packetName);
    return;
  }

  res.sendFile('game.html', { root: './client/geoword' });
});

export default router;
