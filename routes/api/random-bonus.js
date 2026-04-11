import * as validateArray from '../validators/array.js';
import * as validateBoolean from '../validators/boolean.js';
import * as validateInt from '../validators/int.js';
import validateCategoryBundle from '../validators/category-bundle.js';
import getRandomBonuses from '../../database/qbreader/get-random-bonuses.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  req.query = validateArray.difficulties(req.query);
  req.query = validateBoolean.threePartBonuses(req.query);
  req.query = validateBoolean.standardOnly(req.query);
  req.query = validateInt.minYear(req.query);
  req.query = validateInt.maxYear(req.query);
  req.query = validateInt.number(req.query);
  req.query = validateCategoryBundle(req.query);

  const bonuses = await getRandomBonuses(req.query);

  if (bonuses.length === 0) {
    res.status(404);
  }

  res.json({ bonuses });
});

export default router;
