import getUserId from '../../database/account-info/get-user-id.js';
import checkPayment from '../../database/geoword/check-payment.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res, next) => {
  const { username } = req.session;
  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const paid = await checkPayment(packetName, userId);

  if (paid) {
    return res.redirect(`/geoword/division?packetName=${packetName}`);
  }

  next();
});

export default router;
