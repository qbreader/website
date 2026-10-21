import getUserId from '../../../../../database/account-info/get-user-id.js';
import getBuzzCount from '../../../../../database/geoword/get-buzz-count.js';
import getDivisionChoice from '../../../../../database/geoword/get-division-choice.js';
import getPacketSet from '../../../../../database/geoword/get-packet-set.js';
import getQuestionCount from '../../../../../database/geoword/get-question-count.js';
import getTeam from '../../../../../database/geoword/get-team.js';
import getTeamView from '../../../../../database/geoword/paid/results/get-team-view.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const userId = await getUserId(req.session.username);

  const set = await getPacketSet(packetName);
  const team = set && await getTeam(set._id, userId);
  if (!team) {
    return res.status(404).send('You are not on a team for this packet.');
  }

  const division = await getDivisionChoice(packetName, userId);
  if (await getBuzzCount(packetName, userId) < await getQuestionCount(packetName, division)) {
    return res.status(403).send('You must finish the packet before viewing your team.');
  }

  res.json(await getTeamView({ packetName, division, team, viewerId: userId }));
});

export default router;
