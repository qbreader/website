import { ObjectId } from 'mongodb';
import getInvoice from '../../../../database/geoword/admin/get-invoice.js';
import getPaymentAmount from '../../../../database/geoword/admin/get-payment-amount.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  let { _id } = req.query;
  try { _id = new ObjectId(_id); } catch (error) { return res.status(400).json({ error: 'Invalid _id' }); }
  const payment = await getInvoice({ _id });
  const amount = payment ? await getPaymentAmount(payment) : 0;
  res.json({ payment, amount });
});

export default router;
