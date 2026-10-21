import getUserId from '../../../../../database/account-info/get-user-id.js';
import transferTeamOwnership from '../../../../../database/geoword/transfer-team-ownership.js';
import validate, { rules } from '../../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { username } = validate(req.body, { username: rules.string() });
  const newOwnerId = await getUserId(username);

  const transferred = newOwnerId && await transferTeamOwnership({ setId: res.locals.set._id, ownerId: res.locals.userId, newOwnerId });
  res.sendStatus(transferred ? 200 : 404);
});

export default router;
