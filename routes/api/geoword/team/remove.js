import getUserId from '../../../../database/account-info/get-user-id.js';
import removeTeamMember from '../../../../database/geoword/remove-team-member.js';
import requireOwner from './require-owner.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', requireOwner, async (req, res) => {
  const { username } = validate(req.body, { username: rules.string() });
  const memberId = await getUserId(username);
  if (memberId?.equals(res.locals.userId)) {
    return res.status(400).send('You can\'t remove yourself. Leave the team instead.');
  }

  const removed = memberId && await removeTeamMember({ setId: res.locals.set._id, ownerId: res.locals.userId, memberId });
  res.sendStatus(removed ? 200 : 404);
});

export default router;
