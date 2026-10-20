import getUserId from '../../../database/account-info/get-user-id.js';
import hasAnyPacketPrivileges from '../../../database/geoword/has-any-packet-privileges.js';
import hasPacketPrivileges from '../../../database/geoword/has-packet-privileges.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.redirect('/user/login?' + encodeURIComponent(req.originalUrl));
  }

  const userId = await getUserId(username);
  if (!(await hasAnyPacketPrivileges(userId))) {
    return res.redirect('/user/login');
  }

  const { packetName } = req.query;
  if (typeof packetName === 'string' && !(await hasPacketPrivileges(packetName, userId))) {
    return res.redirect('/play/geoword/admin/');
  }

  next();
});

export default router;
