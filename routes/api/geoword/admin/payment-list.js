import getPaymentList from '../../../../database/geoword/admin/get-payment-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const payments = await getPaymentList({ packetName });
  res.json({ payments });
});

export default router;
