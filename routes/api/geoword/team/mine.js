import getSet from '../../../../database/geoword/get-set.js';
import getSetDivisions from '../../../../database/geoword/get-set-divisions.js';
import getTeam from '../../../../database/geoword/get-team.js';
import formatTeam from './format-team.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

/**
 * The player's team in a set (or null; members get its join code), and the divisions a new team there can pick from.
 */
router.get('/', async (req, res) => {
  const { setName } = validate(req.query, { setName: rules.string() });
  const set = await getSet(setName);
  if (!set) {
    return res.sendStatus(404);
  }

  const [team, divisions] = await Promise.all([
    getTeam(set._id, res.locals.userId),
    getSetDivisions(set._id)
  ]);

  // Members only see the team's details: the code is what lets someone else join.
  res.json({ team: team && await formatTeam(team, res.locals.userId), divisions });
});

export default router;
