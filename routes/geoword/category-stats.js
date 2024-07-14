import getUserId from '../../database/account-info/get-user-id.js';
import checkPayment from '../../database/geoword/check-payment.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
  const { username } = req.session;
  const packetName = req.params.packetName;
  const userId = await getUserId(username);

  const paid = await checkPayment(packetName, userId);

  if (!paid) {
    res.redirect('/geoword/payment/' + packetName);
    return;
  }

  res.sendFile('category-stats.html', { root: './client/geoword' });
});

export default router;
