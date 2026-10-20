import getSet from '../../../../database/geoword/get-set.js';
import leaveTeam from '../../../../database/geoword/leave-team.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { setName } = validate(req.body, { setName: rules.string() });
  const set = await getSet(setName);
  if (!set) {
    return res.status(404).send('That set does not exist.');
  }

  const left = await leaveTeam(set._id, res.locals.userId);
  res.sendStatus(left ? 200 : 404);
});

export default router;
