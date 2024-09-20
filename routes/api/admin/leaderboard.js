import leaderboard from '../../../database/account-info/leaderboard.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  const data = await leaderboard(limit);
  res.json({ data });
});

export default router;
