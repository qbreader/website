import getManagedPacketList from '../../../../database/geoword/get-managed-packet-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const packetList = await getManagedPacketList(res.locals.userId);
  res.json({ packetList });
});

export default router;
