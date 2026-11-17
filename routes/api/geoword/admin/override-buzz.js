import overrideBuzz from '../../../../database/geoword/admin/override-buzz.js';
import validateEnum from '../../../validators/enum.js';
import validateObjectId from '../../../validators/object-id.js';
import validateString from '../../../validators/string.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  validateObjectId(req.body, 'buzz_id');
  validateEnum(req.body, 'verdict', { allowedValues: ['correct', 'incorrect'], defaultValue: undefined });
  validateString(req.body, 'reason');
  const { buzz_id: buzzId, packetName, verdict, reason } = req.body;

  if (buzzId === null) { return res.status(400).send('Invalid buzz ID'); }
  if (verdict === undefined) { return res.status(400).send('Invalid verdict'); }

  const result = await overrideBuzz({ buzzId, packetName, isCorrect: verdict === 'correct', reason, adminId: res.locals.userId });

  if (result === null) { return res.sendStatus(404); }
  // the buzz already has this verdict
  if (result.matchedCount === 0) { return res.sendStatus(409); }
  res.sendStatus(200);
});

export default router;
