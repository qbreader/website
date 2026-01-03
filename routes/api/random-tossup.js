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

  if (typeof req.query.alternateSubcategories === 'string') {
    req.query.alternateSubcategories = req.query.alternateSubcategories.split(',');
    req.query.alternateSubcategories = req.query.alternateSubcategories.length ? req.query.alternateSubcategories : undefined;
  } else {
    req.query.alternateSubcategories = undefined;
  }

  if (typeof req.query.categories === 'string') {
    req.query.categories = req.query.categories.split(',');
    req.query.categories = req.query.categories.length ? req.query.categories : undefined;
  } else {
    req.query.categories = undefined;
  }

  if (typeof req.query.subcategories === 'string') {
    req.query.subcategories = req.query.subcategories.split(',');
    req.query.subcategories = req.query.subcategories.length ? req.query.subcategories : undefined;
  } else {
    req.query.subcategories = undefined;
  }

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
