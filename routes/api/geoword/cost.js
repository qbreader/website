import getCost from '../../../database/geoword/get-cost.js';
import isManualPaymentOnly from '../../../database/geoword/is-manual-payment-only.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const cost = await getCost(packetName);
  const manualOnly = await isManualPaymentOnly(packetName);
  res.json({ cost, manualOnly });
});

export default router;
