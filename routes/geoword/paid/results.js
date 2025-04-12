import { Router } from 'express';
import getUser from '../../../database/account-info/get-user';
import getBuzzCount from '../../../database/geoword/get-buzz-count';
import getQuestionCount from '../../../database/geoword/get-question-count';

const router = Router();

// only match routes that do not have a '.' in the URL
router.use(/^\/[^.]*$/, async (req, res, next) => {
  const { username } = req.session;
  const { packetName } = req.query;
  const user = await getUser(username);

  const [buzzCount, questionCount] = await Promise.all([
    getBuzzCount(packetName, user._id),
    getQuestionCount(packetName)
  ]);

  if (!user.admin && buzzCount < questionCount) {
    res.status(403).send('You must finish the game before viewing results.');
    return;
  }

  next();
});
