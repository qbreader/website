import getMaxPacketNumber from '../../database/qbreader/get-max-packet-number.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const maxPacketNumber = await getMaxPacketNumber(req.query.setNames);
  if (maxPacketNumber === 0) {
    res.statusCode = 404;
  }
  res.json({ maxPacketNumber });
});

router.post('/', async (req, res) => {
  const maxPacketNumber = await getMaxPacketNumber(req.body.setNames);
  if (maxPacketNumber === 0) {
    res.statusCode = 404;
  }
  res.json({ maxPacketNumber });
});

export default router;
