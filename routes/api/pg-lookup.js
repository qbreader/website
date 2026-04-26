import getPgLookup from '../../database/qbreader/get-pg-lookup.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { word } = req.query;

  if (!word || typeof word !== 'string' || word.trim() === '') {
    return res.status(400).send('Missing or invalid "word" parameter.');
  }

  const limit = req.query.limit ? parseInt(req.query.limit) : 50;
  if (!Number.isInteger(limit) || limit <= 0) {
    return res.status(400).send('Invalid "limit" parameter.');
  }

  const result = await getPgLookup({ word, limit });
  res.json(result);
});

export default router;
