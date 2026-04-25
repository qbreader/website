import * as validateBoolean from '../validators/boolean.js';
import * as validateInt from '../validators/int.js';
import * as validateObjectId from '../validators/object-id.js';

import getPacket from '../../database/qbreader/get-packet.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateBoolean.modaq(req.query);
  req.query = validateInt.packetNumber(req.query);
  req.query = validateObjectId._id(req.query);
  req.query.questionTypes = req.query.questionTypes ? req.query.questionTypes.split(',') : undefined;

  const packet = await getPacket(req.query);

  if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
    res.statusCode = 404;
  }

  res.json(packet);
});

export default router;
