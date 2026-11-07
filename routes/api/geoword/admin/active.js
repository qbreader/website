import setPacketActive from '../../../../database/geoword/set-packet-active.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { active } = validate(req.query, { active: rules.boolean() });
  const found = await setPacketActive(req.query.packetName, active);
  res.sendStatus(found ? 200 : 404);
});

export default router;
