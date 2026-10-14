import getUserId from '../../../database/account-info/get-user-id.js';
import hasPacketPrivileges from '../../../database/geoword/has-packet-privileges.js';
import checkPayment from '../../../database/geoword/check-payment.js';
import getPacketStatus from '../../../database/geoword/get-packet-status.js';
import { checkToken } from '../../../server/authentication.js';

// router.use(/^\/[^.]*$/, paidMiddleware);

export default async function paidMiddleware (req, res, next) {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    return res.redirect('/play/geoword/login');
  }

  const packetName = req.query.packetName;
  const status = await getPacketStatus(packetName);

  if (status === null) {
    return res.redirect('/play/geoword');
  }

  const userId = await getUserId(username);
  if (status === false && !(await hasPacketPrivileges(packetName, userId))) {
    return res.redirect('/play/geoword');
  }

  const paid = await checkPayment(packetName, userId);

  if (!paid) {
    return res.redirect(`/play/geoword/payment?packetName=${packetName}`);
  }

  next();
}
