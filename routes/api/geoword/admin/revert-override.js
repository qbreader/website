import revertOverride from '../../../../database/geoword/admin/revert-override.js';
import validateObjectId from '../../../validators/object-id.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  validateObjectId(req.body, 'buzz_id');
  const { buzz_id: buzzId, packetName } = req.body;

  if (buzzId === null) { return res.status(400).send('Invalid buzz ID'); }

  const result = await revertOverride({ buzzId, packetName });

  // the buzz doesn't exist or isn't overridden
  if (result.matchedCount === 0) { return res.sendStatus(404); }
  res.sendStatus(200);
});

export default router;
