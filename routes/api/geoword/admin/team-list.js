import getDivisions from '../../../../database/geoword/get-divisions.js';
import getPacketSet from '../../../../database/geoword/get-packet-set.js';
import getTeamList from '../../../../database/geoword/get-team-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const set = await getPacketSet(packetName);
  const teamList = set ? await getTeamList(set._id) : [];
  res.json({ teamList, divisions: await getDivisions(packetName) });
});

export default router;
