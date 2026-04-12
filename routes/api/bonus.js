import * as validateObjectId from '../validators/object-id.js';
import getBonus from '../../database/qbreader/get-bonus.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateObjectId._id(req.query);
  if (!req.query._id) { return res.status(400).send('Invalid Bonus ID'); }
  const bonus = await getBonus(req.query);
  if (bonus === null) { return res.sendStatus(404); }
  res.json({ bonus });
});

export default router;
