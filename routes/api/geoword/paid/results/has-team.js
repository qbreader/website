import getUserId from '../../../../../database/account-info/get-user-id.js';
import getPacketSet from '../../../../../database/geoword/get-packet-set.js';
import getTeam from '../../../../../database/geoword/get-team.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const set = await getPacketSet(req.query.packetName);
  const team = set && await getTeam(set._id, await getUserId(req.session.username));
  res.json({ hasTeam: !!team });
});

export default router;
