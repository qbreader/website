import getRegisteredUsers from '../../../../database/geoword/admin/get-registered-users.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { packetName } = req.query;
  const users = await getRegisteredUsers(packetName);
  res.json({ users });
});

export default router;
