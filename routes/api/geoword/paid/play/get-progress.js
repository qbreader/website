import getUserId from '../../../../../database/account-info/get-user-id.js';
import getProgress from '../../../../../database/geoword/paid/play/get-progress.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const { division, numberCorrect, points, totalCorrectCelerity, tossupsHeard } = await getProgress(packetName, userId);
  res.json({ division, numberCorrect, points, totalCorrectCelerity, tossupsHeard });
});

export default router;
