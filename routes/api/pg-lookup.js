import getPgLookup from '../../database/qbreader/get-pg-lookup.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { word } = req.query;

  if (!word || typeof word !== 'string' || word.trim() === '') {
    return res.status(400).send('Missing or invalid "word" parameter.');
  }

  let limit = 50;
  if (req.query.limit !== undefined) {
    limit = parseInt(req.query.limit);
    if (!Number.isInteger(limit) || limit <= 0 || limit > 200) {
      return res.status(400).send('Invalid "limit" parameter. Must be an integer between 1 and 200.');
    }
  }

  const result = await getPgLookup({ word, limit });
  res.json(result);
});

export default router;
