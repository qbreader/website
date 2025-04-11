import getUserId from '../../../../../database/account-info/get-user-id.js';
import recordDivision from '../../../../../database/geoword/paid/play/record-division.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { username } = req.session;
  const { packetName, division } = req.body;
  const userId = await getUserId(username);
  const result = await recordDivision(packetName, division, userId);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
