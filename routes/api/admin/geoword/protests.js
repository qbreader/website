import getProtests from '../../../../database/geoword/get-protests.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division } = req.query;
  const { protests, packet } = await getProtests(packetName, division);
  res.json({ protests, packet });
});

export default router;
