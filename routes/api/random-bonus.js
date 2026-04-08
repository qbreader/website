import validateCategoryBundle from '../validators/category-bundle.js';
import getRandomBonuses from '../../database/qbreader/get-random-bonuses.js';

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

  req.query.bonusLength = (req.query.threePartBonuses === 'true') ? 3 : undefined;
  req.query.standardOnly = (req.query.standardOnly === 'true');

  const bonuses = await getRandomBonuses(req.query);

  if (bonuses.length === 0) {
    res.status(404);
  }

  res.json({ bonuses });
});

export default router;
