import leaveTeam from '../../../../database/geoword/leave-team.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const result = await leaveTeam(res.locals.set._id, res.locals.userId);
  if (result === 'owner') {
    return res.status(409).send('Make another member the owner before you leave.');
  }
  res.sendStatus(result === 'left' ? 200 : 404);
});

export default router;
