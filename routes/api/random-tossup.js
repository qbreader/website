import validateCategoryBundle from '../validators/category-bundle.js';
import getRandomTossups from '../../database/qbreader/get-random-tossups.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  if (typeof req.query.difficulties === 'string') {
    req.query.difficulties = req.query.difficulties.split(',').map(d => parseInt(d));
    req.query.difficulties = req.query.difficulties.length ? req.query.difficulties : undefined;
  } else {
    req.query.difficulties = undefined;
  }

  req.query = validateCategoryBundle(req.query);

  req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
  req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);
  req.query.number = isNaN(req.query.number) ? undefined : parseInt(req.query.number);

  req.query.powermarkOnly = (req.query.powermarkOnly === 'true');
  req.query.standardOnly = (req.query.standardOnly === 'true');

  const tossups = await getRandomTossups(req.query);

  if (tossups.length === 0) {
    res.status(404);
  }

  res.json({ tossups });
});

export default router;
