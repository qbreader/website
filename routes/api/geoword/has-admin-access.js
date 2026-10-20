import getUserId from '../../../database/account-info/get-user-id.js';
import hasAnyPacketPrivileges from '../../../database/geoword/has-any-packet-privileges.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    return res.json({ hasAdminAccess: false });
  }

  const hasAdminAccess = await hasAnyPacketPrivileges(await getUserId(username));
  res.json({ hasAdminAccess });
});

export default router;
