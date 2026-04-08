import { ObjectId } from 'mongodb';
import getInvoice from './get-invoice.js';

import { Router } from 'express';
import getCost from '../../../../database/geoword/get-cost.js';
const router = Router();

router.get('/', async (req, res) => {
  let { _id } = req.query;
  try { _id = new ObjectId(_id); } catch (error) { return res.status(400).json({ error: 'Invalid _id' }); }
  const payment = await getInvoice({ _id });
  const amount = await getCost(payment?.packet?.name);
  res.json({ payment, amount });
});

export default router;
