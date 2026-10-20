import leaveTeam from '../../../../database/geoword/leave-team.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const left = await leaveTeam(res.locals.set._id, res.locals.userId);
  res.sendStatus(left ? 200 : 404);
});

export default router;
