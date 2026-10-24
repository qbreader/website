import getDivisions from '../../../../database/geoword/get-divisions.js';
import getPacketSet from '../../../../database/geoword/get-packet-set.js';
import getSet from '../../../../database/geoword/get-set.js';
import getTeamList from '../../../../database/geoword/get-team-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const packetSet = await getPacketSet(packetName);
  const set = packetSet && await getSet(packetSet.name);
  const teamList = set ? await getTeamList(set._id) : [];
  res.json({ teamList, divisions: await getDivisions(packetName), maxSize: set?.teams?.maxSize ?? null });
});

export default router;
