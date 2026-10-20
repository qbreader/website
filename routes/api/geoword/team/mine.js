import getTeam from '../../../../database/geoword/get-team.js';

import { Router } from 'express';

const router = Router();

/**
 * The player's team in a set (or null; members get its join code).
 */
router.get('/', async (req, res) => {
  const team = await getTeam(res.locals.set._id, res.locals.userId);
  res.json({ team: team && { teamName: team.teamName, code: team.code, memberCount: team.members.length } });
});

export default router;
