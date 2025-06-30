import renamePacket from '../../../../database/qbreader/admin/rename-packet.js';

import { Router } from 'express';

const router = Router();

router.put('/rename-packet', async (req, res) => {
  const { setName, packetNumber, newPacketName } = req.body;

  if (typeof setName !== 'string' || typeof packetNumber !== 'number' || typeof newPacketName !== 'string') {
    return res.sendStatus(400);
  }

  const result = await renamePacket(setName, packetNumber, newPacketName);

  if (result) {
    res.sendStatus(200);
  } else {
    res.status(404).send('Packet not found');
  }
});

export default router;
