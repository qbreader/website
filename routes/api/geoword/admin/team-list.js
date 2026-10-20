import getPacketSet from '../../../../database/geoword/get-packet-set.js';
import getTeamList from '../../../../database/geoword/get-team-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const set = await getPacketSet(req.query.packetName);
  const teamList = set ? await getTeamList(set._id) : [];
  res.json({ teamList });
});

export default router;
