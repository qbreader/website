import recordPayment from '../../../../database/geoword/record-payment.js';
import getUserId from '../../../../database/account-info/get-user-id.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { packetName, username } = req.body;

  const userId = await getUserId(username);
  if (!userId) { return res.status(400).send('Invalid username'); }

  const result = await recordPayment(packetName, userId, true);

  console.log(userId, result);

  if (result.upsertedCount === 1) {
    res.status(200).send('Payment recorded successfully');
  } else if (result.matchedCount === 1) {
    res.status(400).send('Payment already recorded');
  } else {
    res.status(500).send('Failed to record payment');
  }
});

export default router;
