import getUserId from '../../../../database/account-info/get-user-id.js';
import getSet from '../../../../database/geoword/get-set.js';
import getTeam from '../../../../database/geoword/get-team.js';
import transferTeamOwnership from '../../../../database/geoword/transfer-team-ownership.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { setName, username } = validate(req.body, {
    setName: rules.string(),
    username: rules.string()
  });

  const set = await getSet(setName);
  const team = set && await getTeam(set._id, res.locals.userId);
  if (!team) {
    return res.sendStatus(404);
  }
  if (String(team.owner) !== String(res.locals.userId)) {
    return res.status(403).send('Only the team owner can hand over ownership.');
  }

  const newOwnerId = await getUserId(username);
  const transferred = newOwnerId && await transferTeamOwnership({ setId: set._id, ownerId: res.locals.userId, newOwnerId });
  res.sendStatus(transferred ? 200 : 404);
});

export default router;
