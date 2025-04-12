import getDivisions from '../../../../../database/geoword/get-divisions.js';
import getPacket from '../../../../../database/geoword/paid/results/get-packet.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const divisions = await getDivisions(packetName);
  const packets = {};
  for (const division of divisions) {
    packets[division] = await getPacket(packetName, division);
  }
  res.json({ packets });
});

export default router;
