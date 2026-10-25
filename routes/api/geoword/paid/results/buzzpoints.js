import getUserId from '../../../../../database/account-info/get-user-id.js';
import getPacketSet from '../../../../../database/geoword/get-packet-set.js';
import getTeam from '../../../../../database/geoword/get-team.js';
import getBuzzpoints from '../../../../../database/geoword/paid/results/get-buzzpoints.js';
import validateString from '../../../../validators/string.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateString(req.query, 'packetName');
  const { packetName } = req.query;
  const userId = await getUserId(req.session.username);

  const set = await getPacketSet(packetName);
  const team = set && await getTeam(set._id, userId);

  res.json({ buzzpoints: await getBuzzpoints({ packetName, viewerId: userId, teamIds: team?.members ?? [] }) });
});

export default router;
