import getUserId from '../../../../../database/account-info/get-user-id.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;

  const { packetName } = req.query;
  const userId = await getUserId(username);
  const division = await getDivisionChoice(packetName, userId);

  res.json({ division });
});

export default router;
