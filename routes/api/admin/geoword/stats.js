import getAdminStats from '../../../../database/geoword/get-admin-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName, division } = req.query;
  const stats = await getAdminStats(packetName, division);
  res.json({ stats });
});

export default router;
