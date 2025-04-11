import getPacket from '../../../../../database/geoword/paid/results/get-packet.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division } = req.query;
  const packet = await getPacket(packetName, division);
  res.json({ packet });
});

export default router;
