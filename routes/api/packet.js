import { ObjectId } from 'mongodb';
import getPacket from '../../database/qbreader/get-packet.js';

import { Router } from 'express';

const router = Router();

function castObjectId (id) {
  if (!id) { return null; }

  try {
    return new ObjectId(id);
  } catch (e) {
    return null;
  }
}

router.get('/', async (req, res) => {
  req.query._id = castObjectId(req.query._id);
  let packet;

  const modaq = req.query.modaq === 'true';

  if (req.query._id !== null) {
    packet = await getPacket({ _id: req.query._id, modaq });
  } else {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    packet = await getPacket({ setName, packetNumber, modaq });
  }

  if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
    res.statusCode = 404;
  }

  res.json(packet);
});

export default router;
