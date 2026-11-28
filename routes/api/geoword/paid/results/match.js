import getDivisions from '../../../../../database/geoword/get-divisions.js';
import getPacketSet from '../../../../../database/geoword/get-packet-set.js';
import getTeamByName from '../../../../../database/geoword/get-team-by-name.js';
import getMatch from '../../../../../database/geoword/paid/results/get-match.js';
import validate, { rules } from '../../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const { division, teamName, opponentName } = validate(req.query, {
    division: rules.string(),
    teamName: rules.string(),
    opponentName: rules.string()
  });

  const divisions = await getDivisions(packetName);
  if (!divisions?.includes(division)) {
    return res.status(404).send('The packet has no division with that name.');
  }

  const set = await getPacketSet(packetName);
  const teams = set ? await Promise.all([teamName, opponentName].map(name => getTeamByName(set._id, name))) : [];
  if (teams.length === 0 || teams.some(team => !team)) {
    return res.status(404).send('No team has that name.');
  }
  if (teams[0]._id.equals(teams[1]._id)) {
    return res.status(400).send('A match needs two different teams.');
  }

  const match = await getMatch({ packetName, division, teams });
  if (!match) {
    return res.status(404).send('These teams have not played a match yet.');
  }

  res.json(match);
});

export default router;
