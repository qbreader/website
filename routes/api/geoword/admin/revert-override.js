import revertOverride from '../../../../database/geoword/admin/revert-override.js';
import validate, { rules } from '../../../validators/schema.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  const { buzz_id: buzzId, packetName } = validate(req.body, {
    buzz_id: rules.objectId(),
    packetName: rules.string()
  });

  if (buzzId === null) { return res.status(400).send('Invalid buzz ID'); }

  const result = await revertOverride({ buzzId, packetName });

  // the buzz doesn't exist or isn't overridden
  if (result.matchedCount === 0) { return res.sendStatus(404); }
  res.sendStatus(200);
});

export default router;
