import leaveTeam from '../../../../database/geoword/leave-team.js';

import { Router } from 'express';

const router = Router();

const LEAVE_ERRORS = {
  'only-member': 'You are the only member of your team, so you can\'t leave it.',
  owner: 'Make another member the owner before you leave.'
};

router.post('/', async (req, res) => {
  const result = await leaveTeam(res.locals.set._id, res.locals.userId);
  if (result in LEAVE_ERRORS) {
    return res.status(409).send(LEAVE_ERRORS[result]);
  }
  res.sendStatus(result === 'left' ? 200 : 404);
});

export default router;
