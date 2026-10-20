import createTeam from '../../../../database/geoword/create-team.js';
import isAppropriateString from '../../../../server/moderation/is-appropriate-string.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const MIN_TEAM_NAME_LENGTH = 3;
const MAX_TEAM_NAME_LENGTH = 64;

const router = Router();
router.use(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
}));

router.post('/', async (req, res) => {
  const { teamName: rawTeamName } = validate(req.body, { teamName: rules.string() });
  const teamName = rawTeamName.replace(/\s+/g, ' ');

  if (teamName.length < MIN_TEAM_NAME_LENGTH || teamName.length > MAX_TEAM_NAME_LENGTH) {
    return res.status(400).send(`Team names must be ${MIN_TEAM_NAME_LENGTH}-${MAX_TEAM_NAME_LENGTH} characters.`);
  }
  if (/\p{C}/u.test(teamName) || !isAppropriateString(teamName)) {
    return res.status(400).send('That team name is not allowed.');
  }

  const { set } = res.locals;
  try {
    const team = await createTeam({ set, teamName, userId: res.locals.userId });
    res.status(201).json({ team: { teamName: team.teamName, code: team.code, memberCount: 1 } });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    return res.status(409).send(error.keyPattern?.members
      ? 'You are already on a team in this set.'
      : 'That team name is taken.');
  }
});

export default router;
