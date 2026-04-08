import { buzzes } from '../../../../database/geoword/collections.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

async function resolveProtest (buzzId, decision, reason) {
  const updateDocument = { pendingProtest: false, decision, reason };

  if (decision === 'accept') {
    const buzz = await buzzes.findOne({ _id: buzzId });
    updateDocument.points = 10 + Math.round(10 * buzz.celerity);
  }

  return await buzzes.updateOne(
    { _id: buzzId },
    { $set: updateDocument }
  );
}


const router = Router();

router.post('/', async (req, res) => {
  let { buzz_id: buzzId, decision, reason } = req.body;
  try { buzzId = new ObjectId(buzzId); } catch (e) { return res.status(400).send('Invalid buzz ID'); }
  const result = await resolveProtest(buzzId, decision, reason);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
