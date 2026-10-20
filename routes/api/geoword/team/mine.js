import getSetDivisions from '../../../../database/geoword/get-set-divisions.js';
import getTeam from '../../../../database/geoword/get-team.js';
import formatTeam from './format-team.js';

import { Router } from 'express';

const router = Router();

/**
 * The player's team in a set (or null), and the divisions a new team there can pick from.
 */
router.get('/', async (req, res) => {
  const { set, userId } = res.locals;

  const [team, divisions] = await Promise.all([
    getTeam(set._id, userId),
    getSetDivisions(set._id)
  ]);

  res.json({ team: team && await formatTeam(team, userId), divisions });
});

export default router;
