import getPacket from '../../database/qbreader/get-packet.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const setName = req.query.setName;
  const packetNumber = parseInt(req.query.packetNumber);
  const modaq = req.query.modaq === 'true';
  const packet = await getPacket({ setName, packetNumber, modaq });
  if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
    res.statusCode = 404;
  }
  res.json(packet);
});

export default router;
