import getAdminStats from './get-admin-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const stats = await getAdminStats({ packetName });
  res.json({ stats });
});

export default router;
