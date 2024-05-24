import getUser from '../../../database/account-info/get-user.js';
import getBuzzCount from '../../../database/geoword/get-buzz-count.js';
import getPacket from '../../../database/geoword/get-packet.js';
import getQuestionCount from '../../../database/geoword/get-question-count.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.redirect('/geoword/login');
    return;
  }

  const { packetName, division } = req.query;
  const user = await getUser(username);

  const [buzzCount, questionCount] = await Promise.all([
    getBuzzCount(packetName, user._id),
    getQuestionCount(packetName)
  ]);

  if (!user.admin && buzzCount < questionCount) {
    res.sendStatus(403);
    return;
  }

  const packet = await getPacket(packetName, division);
  res.json({ packet });
});

export default router;
