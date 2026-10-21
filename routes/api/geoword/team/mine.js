import getTeam from '../../../../database/geoword/get-team.js';
import formatTeam from './format-team.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { set, userId } = res.locals;
  const team = await getTeam(set._id, userId);
  res.json({ team: team && await formatTeam(team, userId) });
});

export default router;
