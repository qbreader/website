import getTeam from '../../../../database/geoword/get-team.js';
import joinTeam from '../../../../database/geoword/join-team.js';
import formatTeam from './format-team.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
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
    const team = await joinTeam({ setId: set._id, teamName: teamName.replace(/\s+/g, ' '), code, userId });
    if (!team) {
      return res.status(404).send('No team has that name and code.');
    }
    res.json({ team: await formatTeam(team, userId) });
  } catch (error) {
    if (error.code !== 11000) { throw error; }
    res.status(409).send('You are already on a team in this set.');
  }
});

export default router;
