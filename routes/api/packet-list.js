import getPacketList from '../../database/qbreader/get-packet-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const setName = req.query.setName;

  if (!setName || typeof setName !== 'string') {
    return res.sendStatus(400);
  }

  const packetList = await getPacketList(setName);
  res.json({ packetList });
});

export default router;
