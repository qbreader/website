import * as validateString from '../validators/string.js';
import getPacketList from '../../database/qbreader/get-packet-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateString.setName(req.query);
  if (!req.query.setName) { return res.sendStatus(400); }
  const packetList = await getPacketList(req.query.setName);
  res.json({ packetList });
});

export default router;
