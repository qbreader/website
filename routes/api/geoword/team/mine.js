import getTeam from '../../../../database/geoword/get-team.js';
import formatTeam from './format-team.js';

import { Router } from 'express';

const router = Router();

/**
 * The player's team in a set (or null), and whether the set has team registration open.
 */
router.get('/', async (req, res) => {
  const { set, userId } = res.locals;
  const team = await getTeam(set._id, userId);
  res.json({ team: team && await formatTeam(team, userId), teamsEnabled: !!set.teamsEnabled });
});

export default router;
