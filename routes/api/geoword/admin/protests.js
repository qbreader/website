import getProtests from '../../../../database/geoword/admin/get-protests.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const protests = await getProtests({ packetName });
  res.json({ protests });
});

export default router;
