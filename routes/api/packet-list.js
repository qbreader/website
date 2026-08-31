import * as validateBoolean from '../validators/boolean.js';
import * as validateObjectId from '../validators/object-id.js';
import * as validateString from '../validators/string.js';
import getPacketList from '../../database/qbreader/get-packet-list.js';
import getPacketMetadata from '../../database/qbreader/packet-metadata-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateBoolean.expand(req.query);
  if (req.query.expand) {
    req.query = validateObjectId.set_id(req.query);
    if (!req.query.set_id) { return res.status(400).send('Invalid Set ID'); }
    const packetList = await getPacketMetadata(req.query.set_id);
    return res.json({ packetList, setName: packetList[0]?.setName });
  }
  req.query = validateString.setName(req.query);
  if (!req.query.setName) { return res.sendStatus(400); }
  const packetList = await getPacketList(req.query.setName);
  return res.json({ packetList });
});

export default router;
