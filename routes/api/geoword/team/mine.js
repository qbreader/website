import getSetDivisions from '../../../../database/geoword/get-set-divisions.js';
import getTeam from '../../../../database/geoword/get-team.js';

import { Router } from 'express';

const router = Router();

/**
 * The player's team in a set (or null), and the divisions a new team there can pick from.
 */
router.get('/', async (req, res) => {
  const { set } = res.locals;

  const [team, divisions] = await Promise.all([
    getTeam(set._id, res.locals.userId),
    getSetDivisions(set._id)
  ]);

  res.json({ team: team && { teamName: team.teamName, division: team.division }, divisions });
});

export default router;
