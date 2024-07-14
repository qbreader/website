import checkPayment from '../../database/geoword/check-payment.js';
import getUserId from '../../database/account-info/get-user-id.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
  const { username } = req.session;
  const packetName = req.params.packetName;
  const userId = await getUserId(username);

  const paid = await checkPayment(packetName, userId);

  if (paid) {
    res.sendFile('compare.html', { root: './client/geoword' });
    return;
  }

  res.redirect('/geoword/payment/' + packetName);
});

export default router;
