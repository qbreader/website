import { packets } from '../../../../database/geoword/collections.js';
import getTeamList from '../../../../database/geoword/get-team-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const packet = await packets.findOne({ name: packetName }, { projection: { set: 1 } });
  const teamList = packet?.set ? await getTeamList(packet.set._id) : [];
  res.json({ teamList });
});

export default router;
