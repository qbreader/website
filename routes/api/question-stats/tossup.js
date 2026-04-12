import * as validateObjectId from '../../validators/object-id.js';
import getSingleTossupStats from '../../../database/account-info/question-stats/get-single-tossup-stats.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateObjectId._id(req.query);
  if (!req.query._id) { return res.status(400).send('Invalid Tossup ID'); }
  const stats = await getSingleTossupStats(req.query);
  res.json({ stats });
});

export default router;
