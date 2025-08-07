import getPacket from '../../../database/qbreader/get-packet.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const setName = req.query.setName;
  const packetNumber = parseInt(req.query.packetNumber);
  const packet = await getPacket({ setName, packetNumber, questionTypes: ['bonuses'] });
  if (packet.bonuses.length === 0) {
    res.statusCode = 404;
  }
  res.json(packet);
});

export default router;
