import paidMiddleware from './paid-middleware.js';
import getUser from '../../../database/account-info/get-user.js';
import getBuzzCount from '../../../database/geoword/get-buzz-count.js';
import getQuestionCount from '../../../database/geoword/get-question-count.js';

import { Router } from 'express';
const router = Router();

router.use(/^\/[^.]*$/, paidMiddleware);

// only match routes that do not have a '.' in the URL
router.use(/^\/[^.]*$/, async (req, res, next) => {
  const { username } = req.session;
  const { packetName } = req.query;
  const user = await getUser(username);

  const [buzzCount, questionCount] = await Promise.all([
    getBuzzCount(packetName, user?._id),
    getQuestionCount(packetName)
  ]);

  if (!user.admin && buzzCount < questionCount) {
    return res.status(403).send('You must finish the game before viewing results.');
  }

  next();
});

export default router;
