import getRandomName from '../../server/get-random-name.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const randomName = getRandomName();
  res.json({ randomName });
});

export default router;
