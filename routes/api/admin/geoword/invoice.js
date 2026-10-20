import { ObjectId } from 'mongodb';
import getInvoice from '../../../../database/geoword/admin/get-invoice.js';

import { Router } from 'express';
import getCost from '../../../../database/geoword/get-cost.js';
import hasPacketPrivileges from '../../../../database/geoword/has-packet-privileges.js';
const router = Router();

router.get('/', async (req, res) => {
  let { _id } = req.query;
  try { _id = new ObjectId(_id); } catch (error) { return res.status(400).json({ error: 'Invalid _id' }); }
  const payment = await getInvoice({ _id });
  if (!(await hasPacketPrivileges(payment?.packet?.name, res.locals.userId))) {
    return res.sendStatus(403);
  }

  const amount = await getCost(payment?.packet?.name);
  res.json({ payment, amount });
});

export default router;
