import getRandomBonuses from '../../database/qbreader/get-random-bonuses.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  if (req.query.difficulties) {
    req.query.difficulties = req.query.difficulties
      .split(',')
      .map((difficulty) => parseInt(difficulty));

    req.query.difficulties = req.query.difficulties.length ? req.query.difficulties : undefined;
  }

  if (req.query.alternateSubcategories) {
    req.query.alternateSubcategories = req.query.alternateSubcategories.split(',');
    req.query.alternateSubcategories = req.query.alternateSubcategories.length ? req.query.alternateSubcategories : undefined;
  }

  if (req.query.categories) {
    req.query.categories = req.query.categories.split(',');
    req.query.categories = req.query.categories.length ? req.query.categories : undefined;
  }

  if (req.query.subcategories) {
    req.query.subcategories = req.query.subcategories.split(',');
    req.query.subcategories = req.query.subcategories.length ? req.query.subcategories : undefined;
  }

  req.query.bonusLength = (req.query.threePartBonuses === 'true') ? 3 : undefined;

  req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
  req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);
  req.query.number = isNaN(req.query.number) ? undefined : parseInt(req.query.number);

  req.query.standardOnly = (req.query.standardOnly === 'true');

  const bonuses = await getRandomBonuses(req.query);

  if (bonuses.length === 0) {
    res.status(404);
  }

  res.json({ bonuses });
});

export default router;
