import getCost from '../../../../database/geoword/get-cost.js';
import recordPayment from '../../../../database/geoword/record-payment.js';
import getUserId from '../../../../database/account-info/get-user-id.js';
import getPacketStatus from '../../../../database/geoword/get-packet-status.js';

import { Router } from 'express';

const router = Router();

router.put('/', async (req, res) => {
  const { packetName, username } = req.body;

  if (await getPacketStatus(packetName) === null) { return res.status(404).send('Packet not found'); }

  const userId = await getUserId(username);
  if (!userId) { return res.status(400).send('User not found'); }

  const amountInCents = await getCost(packetName);
  const result = await recordPayment(packetName, userId, { manual: true, amountInCents, recordedBy: res.locals.userId });

  console.log(userId, result);

  if (result.upsertedCount === 1 || result.modifiedCount === 1) {
    res.status(200).send('Payment recorded successfully');
  } else {
    res.status(500).send('Failed to record payment');
  }
});

export default router;
