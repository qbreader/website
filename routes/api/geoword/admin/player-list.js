import getPlayerList from '../../../../database/geoword/get-player-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division } = req.query;
  const players = await getPlayerList(packetName, division);
  res.json({ players });
});

export default router;
