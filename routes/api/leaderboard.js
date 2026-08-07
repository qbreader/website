import getLeaderboard, { lastGeneratedAt } from '../../database/account-info/leaderboard.js';
import validateInt from '../validators/int.js';

import { Router } from 'express';

// matches the five minute cache in database/account-info/leaderboard.js
const MAX_AGE_SECONDS = 300;

const router = Router();

router.get('/', async (req, res) => {
  req.query = validateInt(req.query, 'limit', { defaultValue: 50, lowerBound: 1, upperBound: 500 });
  req.query = validateInt(req.query, 'minQuestions', { defaultValue: 0, lowerBound: 0 });
  const { limit, minQuestions } = req.query;

  // express 4 does not forward rejected promises to the error handler,
  // so an unhandled rejection here would take down the process
  let everyone;
  try {
    everyone = await getLeaderboard();
  } catch (error) {
    console.error('GET /api/leaderboard:', error);
    res.status(503).json({ error: 'The leaderboard is temporarily unavailable. Try again shortly.' });
    return;
  }

  const leaderboard = everyone
    .filter((row) => row.total >= minQuestions)
    .slice(0, limit);

  res.set('Cache-Control', `public, max-age=${MAX_AGE_SECONDS}`);
  res.json({
    leaderboard,
    count: leaderboard.length,
    generatedAt: lastGeneratedAt()
  });
});

export default router;
