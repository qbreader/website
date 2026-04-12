import * as validateObjectId from '../validators/object-id.js';
import getTossup from '../../database/qbreader/get-tossup.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateObjectId._id(req.query);
  if (!req.query._id) { return res.status(400).send('Invalid Tossup ID'); }
  const tossup = await getTossup(req.query);
  if (tossup === null) { return res.sendStatus(404); }

  res.json({ tossup });
});

export default router;
