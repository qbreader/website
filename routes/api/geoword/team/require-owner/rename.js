import renameTeam from '../../../../../database/geoword/rename-team.js';
import validateTeamName from '../validate-team-name.js';
import validate, { rules } from '../../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { teamName: rawTeamName } = validate(req.body, { teamName: rules.string() });
  const { teamName, error: nameError } = validateTeamName(rawTeamName);
  if (nameError) {
    return res.status(400).send(nameError);
  }

  try {
    await renameTeam({ setId: res.locals.set._id, ownerId: res.locals.userId, teamName });
    res.json({ teamName });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    res.status(409).send('That team name is taken.');
  }
});

export default router;
