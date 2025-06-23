import clearReports from '../../../database/qbreader/admin/clear-reports.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/', async (req, res) => {
  let { _id, type } = req.body;
  try { _id = new ObjectId(_id); } catch (e) { return res.status(400).send('Invalid ID'); }
  const result = await clearReports(_id, type);
  res.sendStatus(result.modifiedCount > 0 ? 200 : 500);
});

export default router;
