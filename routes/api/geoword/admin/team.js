import getDivisions from '../../../../database/geoword/get-divisions.js';
import getPacketSet from '../../../../database/geoword/get-packet-set.js';
import getTeamByName from '../../../../database/geoword/get-team-by-name.js';
import getTeamView from '../../../../database/geoword/paid/results/get-team-view.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const { teamName, division } = validate(req.query, {
    teamName: rules.string(),
    division: rules.string()
  });

  const set = await getPacketSet(packetName);
  const team = set && await getTeamByName(set._id, teamName);
  if (!team) {
    return res.status(404).send('No team has that name.');
  }

  const divisions = await getDivisions(packetName);
  res.json(await getTeamView({
    packetName,
    division: divisions.includes(division) ? division : divisions[0],
    team,
    viewerId: res.locals.userId
  }));
});

export default router;
