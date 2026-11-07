import getPacketInfo from '../../../../database/geoword/get-packet-info.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = validate(req.query, { packetName: rules.string() });
  const packetInfo = await getPacketInfo(packetName);

  if (!packetInfo) { return res.sendStatus(404); }

  res.json({ packetInfo });
});

export default router;
