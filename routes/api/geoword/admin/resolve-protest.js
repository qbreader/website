import resolveProtest from '../../../../database/geoword/admin/resolve-protest.js';
import validateEnum from '../../../validators/enum.js';
import validateObjectId from '../../../validators/object-id.js';
import validateString from '../../../validators/string.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  validateObjectId(req.body, 'buzz_id');
  validateEnum(req.body, 'decision', { allowedValues: ['accept', 'deny'], defaultValue: undefined });
  validateString(req.body, 'reason');
  const { buzz_id: buzzId, packetName, decision, reason } = req.body;

  if (buzzId === null) { return res.status(400).send('Invalid buzz ID'); }
  if (decision === undefined) { return res.status(400).send('Invalid decision'); }

  const result = await resolveProtest({ buzzId, packetName, decision, reason, adminId: res.locals.userId });

  // the buzz doesn't exist or has no pending protest
  if (result === null) { return res.sendStatus(404); }
  res.sendStatus(200);
});

export default router;
