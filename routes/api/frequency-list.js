import * as validateArray from '../validators/array.js';
import * as validateEnum from '../validators/enum.js';
import * as validateInt from '../validators/int.js';
import getFrequencyList from '../../database/qbreader/get-frequency-list.js';

import { Router } from 'express';
const router = Router();

router.use('/', async (req, res) => {
  req.query = validateArray.difficulties(req.query);
  req.query = validateEnum.alternateSubcategory(req.query);
  req.query = validateEnum.category(req.query);
  req.query = validateEnum.questionType(req.query);
  req.query = validateEnum.subcategory(req.query);
  req.query = validateInt.limit(req.query);
  req.query = validateInt.maxYear(req.query);
  req.query = validateInt.minYear(req.query);

  const frequencyList = await getFrequencyList(req.query);
  if (frequencyList.length === 0) {
    res.status(404);
  }
  res.json({ frequencyList });
});

export default router;
