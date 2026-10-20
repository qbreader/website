import createTeam from '../../../../database/geoword/create-team.js';
import getSetDivisions from '../../../../database/geoword/get-set-divisions.js';
import isAppropriateString from '../../../../server/moderation/is-appropriate-string.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const MIN_TEAM_NAME_LENGTH = 3;
const MAX_TEAM_NAME_LENGTH = 32;

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
  const teamName = rawTeamName.replace(/\s+/g, ' ');

  if (teamName.length < MIN_TEAM_NAME_LENGTH || teamName.length > MAX_TEAM_NAME_LENGTH) {
    return res.status(400).send(`Team names must be ${MIN_TEAM_NAME_LENGTH}-${MAX_TEAM_NAME_LENGTH} characters.`);
  }
  if (/\p{C}/u.test(teamName) || !isAppropriateString(teamName)) {
    return res.status(400).send('That team name is not allowed.');
  }

  const { set } = res.locals;
  if (!(await getSetDivisions(set._id)).includes(division)) {
    return res.status(400).send('Choose a division.');
  }

  try {
    const team = await createTeam({ set, teamName, division, userId: res.locals.userId });
    res.status(201).json({ team: { teamName: team.teamName, division: team.division } });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    // Which unique index was violated: see createTeam.
    return res.status(409).send(error.keyPattern?.members
      ? 'You are already on a team in this set.'
      : 'That team name is taken.');
  }
});

export default router;
