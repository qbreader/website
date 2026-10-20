import createTeam from '../../../../database/geoword/create-team.js';
import getSetDivisions from '../../../../database/geoword/get-set-divisions.js';
import formatTeam from './format-team.js';
import validateTeamName from './validate-team-name.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false
}));

router.post('/', async (req, res) => {
  const { teamName: rawTeamName, division } = validate(req.body, {
    teamName: rules.string(),
    division: rules.string()
  });
  const { teamName, error: nameError } = validateTeamName(rawTeamName);
  if (nameError) {
    return res.status(400).send(nameError);
  }

  const { set } = res.locals;
  if (!(await getSetDivisions(set._id)).includes(division)) {
    return res.status(400).send('Choose a division.');
  }

  try {
    const team = await createTeam({ set, teamName, division, userId: res.locals.userId });
    res.status(201).json({ team: await formatTeam(team, res.locals.userId) });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    // Which unique index was violated: see tools/geoword/create-indexes.js.
    return res.status(409).send(error.keyPattern?.members
      ? 'You are already on a team in this set.'
      : 'That team name is taken.');
  }
});

export default router;
