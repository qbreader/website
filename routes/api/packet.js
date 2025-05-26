import { ObjectId } from 'mongodb';
import getPacket from '../../database/qbreader/get-packet.js';

import { Router } from 'express';

const router = Router();

function castObjectId (id) {
  try {
    return ObjectId(id);
  } catch (e) {
    return null;
  }
}

router.get('/', async (req, res) => {
  req.query._id = castObjectId(req.query._id);
  let packet;

  if (req.query._id !== null) {
    packet = await getPacket({ _id: req.query._id });
  } else {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const modaq = req.query.modaq === 'true';
    packet = await getPacket({ setName, packetNumber, modaq });
  }

  if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
    res.statusCode = 404;
  }

  res.json(packet);
});

export default router;
