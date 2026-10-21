import leaveTeam from '../../../../database/geoword/leave-team.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const result = await leaveTeam(res.locals.set._id, res.locals.userId);
  if (result === 'only-member') {
    return res.status(409).send('You are the only member of your team, so you can\'t leave it.');
  }
  res.sendStatus(result === 'left' ? 200 : 404);
});

export default router;
