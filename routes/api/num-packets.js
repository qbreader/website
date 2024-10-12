import getNumPackets from '../../database/qbreader/get-num-packets.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const numPackets = await getNumPackets(req.query.setName);
  if (numPackets === 0) {
    res.statusCode = 404;
  }
  res.json({ numPackets });
});

export default router;
