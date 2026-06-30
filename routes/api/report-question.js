import { ObjectId } from 'mongodb';
import reportQuestion from '../../database/qbreader/report-question.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();
router.use(rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
}));

router.post('/', async (req, res) => {
  let _id;
  try { _id = new ObjectId(req.body._id); } catch (e) {
    return res.status(400).send('Invalid ID');
  }

  const reason = req.body.reason ?? '';
  const description = req.body.description ?? '';
  const successful = await reportQuestion(_id, reason, description);
  if (successful) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(500);
  }
});

export default router;
