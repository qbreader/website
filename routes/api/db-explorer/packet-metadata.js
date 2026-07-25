import * as validateObjectId from '../../validators/object-id.js';
import getPacketMetadata from '../../../database/qbreader/packet-metadata-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateObjectId.set_id(req.query);
  if (!req.query.set_id) { return res.status(400).send('Invalid Set ID'); }
  const data = await getPacketMetadata(req.query.set_id);
  res.json({ data, setName: data[0]?.setName });
});

export default router;
