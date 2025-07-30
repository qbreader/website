import getSingleTossupStats from '../../../database/account-info/question-stats/get-single-tossup-stats.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
  let _id;
  try { _id = new ObjectId(req.query._id); } catch (e) { return res.status(400).send('Invalid Tossup ID'); }
  const stats = await getSingleTossupStats(_id);
  res.json({ stats });
});

export default router;
