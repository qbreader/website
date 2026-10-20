import getBuzzes from '../../../../database/geoword/get-buzzes.js';
import getUserId from '../../../../database/account-info/get-user-id.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division, player1, player2 } = req.query;
  const player1Buzzes = await getBuzzes(packetName, division, await getUserId(player1));
  const player2Buzzes = await getBuzzes(packetName, division, await getUserId(player2));
  res.json({ player1Buzzes, player2Buzzes });
});

export default router;
