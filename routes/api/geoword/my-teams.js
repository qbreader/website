import getUserId from '../../../database/account-info/get-user-id.js';
import getTeamSetNames from '../../../database/geoword/get-team-set-names.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    return res.json({ setNames: [] });
  }

  res.json({ setNames: await getTeamSetNames(await getUserId(username)) });
});

export default router;
