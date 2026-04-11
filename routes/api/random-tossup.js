import * as validateArray from '../validators/array.js';
import * as validateBoolean from '../validators/boolean.js';
import * as validateInt from '../validators/int.js';
import validateCategoryBundle from '../validators/category-bundle.js';
import getRandomTossups from '../../database/qbreader/get-random-tossups.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateArray.difficulties(req.query);
  req.query = validateBoolean.powermarkOnly(req.query);
  req.query = validateBoolean.standardOnly(req.query);
  req.query = validateInt.minYear(req.query);
  req.query = validateInt.maxYear(req.query);
  req.query = validateInt.number(req.query);
  req.query = validateCategoryBundle(req.query);

  const tossups = await getRandomTossups(req.query);

  if (tossups.length === 0) {
    res.status(404);
  }

  res.json({ tossups });
});

export default router;
