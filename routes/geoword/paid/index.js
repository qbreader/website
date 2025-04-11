import playRouter from './play/index.js';

import getUserId from '../../../database/account-info/get-user-id.js';
import isAdmin from '../../../database/account-info/is-admin.js';
import checkPayment from '../../../database/geoword/check-payment.js';
import getPacketStatus from '../../../database/geoword/get-packet-status.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

// only match routes that do not have a '.' in the URL
router.use(/^\/[^.]*$/, async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.redirect('/geoword/login');
  }

  const packetName = req.query.packetName;
  const status = await getPacketStatus(packetName);

  if (status === null) {
    return res.redirect('/geoword');
  }

  const admin = await isAdmin(username);
  if (status === false && !admin) {
    return res.redirect('/geoword');
  }

  const userId = await getUserId(username);
  const paid = await checkPayment(packetName, userId);

  if (!paid) {
    return res.redirect(`/geoword/payment?packetName=${packetName}`);
  }

  next();
});

router.use('/play', playRouter);

export default router;
