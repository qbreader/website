import getTeam from '../../../../database/geoword/get-team.js';
import joinTeam from '../../../../database/geoword/join-team.js';
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
  const { teamName, code } = validate(req.body, {
    teamName: rules.string(),
    code: rules.string()
  });
  const { set, userId } = res.locals;

  if (await getTeam(set._id, userId)) {
    return res.status(409).send('You are already on a team in this set.');
  }

  try {
    // The same answer for a missing team and a wrong code.
    const team = await joinTeam({ setId: set._id, teamName: teamName.replace(/\s+/g, ' '), code, userId });
    if (!team) {
      return res.status(404).send('No team has that name and code.');
    }
    res.json({ team: { teamName: team.teamName, division: team.division, code: team.code, memberCount: team.members.length } });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    // Lost a race with another join or create by the same player: see tools/geoword/create-indexes.js.
    res.status(409).send('You are already on a team in this set.');
  }
});

export default router;
