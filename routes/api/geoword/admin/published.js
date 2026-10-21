import setPacketPublished from '../../../../database/geoword/set-packet-published.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { published } = validate(req.query, { published: rules.boolean() });
  const found = await setPacketPublished(req.query.packetName, published);
  res.sendStatus(found ? 200 : 404);
});

export default router;
