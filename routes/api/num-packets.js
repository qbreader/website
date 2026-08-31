import * as validateString from '../validators/string.js';
import getNumPackets from '../../database/qbreader/get-num-packets.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateString.setName(req.query);
  const numPackets = await getNumPackets(req.query.setName);
  if (numPackets === 0) { res.statusCode = 404; }
  res.json({ numPackets });
});

export default router;
