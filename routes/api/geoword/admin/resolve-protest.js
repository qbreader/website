import resolveProtest from '../../../../database/geoword/admin/resolve-protest.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { buzz_id: buzzId, packetName, decision, reason } = validate(req.body, {
    buzz_id: rules.objectId(),
    packetName: rules.string(),
    decision: rules.enum({ allowedValues: ['accept', 'deny'], defaultValue: undefined }),
    reason: rules.string()
  });

  if (buzzId === null) { return res.status(400).send('Invalid buzz ID'); }
  if (decision === undefined) { return res.status(400).send('Invalid decision'); }

  const result = await resolveProtest({ buzzId, packetName, decision, reason, adminId: res.locals.userId });

  // the buzz doesn't exist or has no pending protest
  if (result === null) { return res.sendStatus(404); }
  res.sendStatus(200);
});

export default router;
