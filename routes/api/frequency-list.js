import validate, { rules } from '../validators/schema.js';
import getFrequencyList from '../../database/qbreader/get-frequency-list.js';

import { Router } from 'express';
const router = Router();

router.use('/', async (req, res) => {
  const query = validate(req.query, {
    alternateSubcategory: rules.enum.alternateSubcategory,
    category: rules.enum.category,
    difficulties: rules.array.difficulties,
    limit: rules.int.limit,
    maxYear: rules.int.maxYear,
    minYear: rules.int.minYear,
    questionType: rules.enum.questionType,
    subcategory: rules.enum.subcategory
  });

  const frequencyList = await getFrequencyList(query);
  if (frequencyList.length === 0) {
    res.status(404);
  }
  res.json({ frequencyList });
});

export default router;
