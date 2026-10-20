import getSet from '../../../../database/geoword/get-set.js';
import getTeam from '../../../../database/geoword/get-team.js';
import joinTeam from '../../../../database/geoword/join-team.js';
import { TEAM_CODE_LENGTH } from '../../../../database/geoword/generate-team-code.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
// Keyed by account, not IP, so a wrong guess costs the guesser's account wherever they come from.
router.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req, res) => String(res.locals.userId),
  standardHeaders: true,
  legacyHeaders: false
}));

router.post('/', async (req, res) => {
  const { setName, teamName, code } = validate(req.body, {
    setName: rules.string(),
    teamName: rules.string(),
    code: rules.string()
  });

  const set = await getSet(setName);
  if (!set) {
    return res.status(404).send('That set does not exist.');
  }
  if (await getTeam(set._id, res.locals.userId)) {
    return res.status(409).send('You are already on a team in this set.');
  }

  // Same answer for a missing team and a wrong code.
  const invalid = () => res.status(404).send('No team has that name and code.');
  if (code.length !== TEAM_CODE_LENGTH) {
    return invalid();
  }

  try {
    const team = await joinTeam({ setId: set._id, teamName: teamName.replace(/\s+/g, ' '), code, userId: res.locals.userId });
    if (!team) {
      return invalid();
    }
    res.json({ team: { teamName: team.teamName, division: team.division, code: team.code, memberCount: team.members.length + 1 } });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    // Lost a race with another join or create by the same player: see tools/geoword/create-indexes.js.
    res.status(409).send('You are already on a team in this set.');
  }
});

export default router;
