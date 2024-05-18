import getDivisions from '../../../database/geoword/get-divisions.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const divisions = await getDivisions(req.query.packetName);
  res.json({ divisions });
});

export default router;
