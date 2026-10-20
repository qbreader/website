import getUserId from '../../../../database/account-info/get-user-id.js';
import getSet from '../../../../database/geoword/get-set.js';
import getTeam from '../../../../database/geoword/get-team.js';
import removeTeamMember from '../../../../database/geoword/remove-team-member.js';
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
    return res.status(403).send('Only the team owner can remove players.');
  }

  const memberId = await getUserId(username);
  if (String(memberId) === String(res.locals.userId)) {
    return res.status(400).send('You can\'t remove yourself. Leave the team instead.');
  }

  const removed = memberId && await removeTeamMember({ setId: set._id, ownerId: res.locals.userId, memberId });
  res.sendStatus(removed ? 200 : 404);
});

export default router;
