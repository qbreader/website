import { ObjectId } from 'mongodb';
import reportQuestion from '../../database/qbreader/report-question.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  let _id;
  try { _id = new ObjectId(req.body._id); } catch (e) {
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(400).send('Invalid ID');
  }

  const reason = req.body.reason ?? '';
  const description = req.body.description ?? '';
  const successful = await reportQuestion(_id, reason, description);
  if (successful) {
    res.header('Access-Control-Allow-Origin', '*');
    return res.sendStatus(200);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
    return res.sendStatus(500);
  }
});

export default router;
