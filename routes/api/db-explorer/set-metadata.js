import getSetMetadata from '../../../database/qbreader/set-metadata-list.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  req.query.limit = parseInt(req.query.limit);
  req.query.limit = isNaN(req.query.limit) ? undefined : req.query.limit;
  if (req.query.limit < 0) req.query.limit = 0;
  const data = await getSetMetadata(req.query.limit);
  res.json({ data });
});

export default router;
