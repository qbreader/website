import getSet from '../../../../database/geoword/get-set.js';
import getTeam from '../../../../database/geoword/get-team.js';
import renameTeam from '../../../../database/geoword/rename-team.js';
import validateTeamName from './validate-team-name.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { setName, teamName: rawTeamName } = validate(req.body, {
    setName: rules.string(),
    teamName: rules.string()
  });
  const { teamName, error } = validateTeamName(rawTeamName);
  if (error) {
    return res.status(400).send(error);
  }

  const set = await getSet(setName);
  const team = set && await getTeam(set._id, res.locals.userId);
  if (!team) {
    return res.sendStatus(404);
  }
  if (String(team.owner) !== String(res.locals.userId)) {
    return res.status(403).send('Only the team owner can rename the team.');
  }

  try {
    await renameTeam({ setId: set._id, ownerId: res.locals.userId, teamName });
    res.json({ teamName });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    res.status(409).send('That team name is taken.');
  }
});

export default router;
