import getUserId from '../../../../../database/account-info/get-user-id.js';
import getBuzzes from '../../../../../database/geoword/get-buzzes.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;

  const { packetName, division, opponent } = req.query;
  const myBuzzes = await getBuzzes(packetName, division, await getUserId(username));
  const opponentBuzzes = (await getBuzzes(packetName, division, await getUserId(opponent))).slice(0, myBuzzes.length);

  res.json({ myBuzzes, opponentBuzzes });
});

export default router;
