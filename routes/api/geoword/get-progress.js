import getUserId from '../../../database/account-info/get-user-id.js';
import getProgress from '../../../database/geoword/get-progress.js';
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

  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const { division, numberCorrect, points, totalCorrectCelerity, tossupsHeard } = await getProgress(packetName, userId);

  res.json({ division, numberCorrect, points, totalCorrectCelerity, tossupsHeard });
});

export default router;
