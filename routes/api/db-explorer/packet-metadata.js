import getPacketMetadata from '../../../database/qbreader/packet-metadata-list.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  try {
    req.query.setId = new ObjectId(req.query.setId);
  } catch (e) {
    res.status(400).send('Invalid set ID');
    return;
  }
  const data = await getPacketMetadata(req.query.setId);
  res.json({ data, setName: data[0]?.setName });
});

export default router;
