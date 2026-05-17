import * as validateInt from '../validators/int.js';
import * as validateString from '../validators/string.js';
import getPgLookup from '../../database/qbreader/get-pg-lookup.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateInt.limit(req.query);
  req.query = validateString.word(req.query);
  const result = await getPgLookup(req.query);
  res.json(result);
});

export default router;
