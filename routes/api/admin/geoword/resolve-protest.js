import getBuzzPacketName from '../../../../database/geoword/admin/get-buzz-packet-name.js';
import resolveProtest from '../../../../database/geoword/admin/resolve-protest.js';
import hasPacketPrivileges from '../../../../database/geoword/has-packet-privileges.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.post('/', async (req, res) => {
  let { buzz_id: buzzId, decision, reason } = req.body;
  try { buzzId = new ObjectId(buzzId); } catch (e) { return res.status(400).send('Invalid buzz ID'); }
  if (!(await hasPacketPrivileges(await getBuzzPacketName(buzzId), res.locals.userId))) {
    return res.sendStatus(403);
  }

  const result = await resolveProtest(buzzId, decision, reason);

  if (result) {
    res.sendStatus(200);
  } else {
    res.sendStatus(500);
  }
});

export default router;
