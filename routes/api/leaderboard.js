import getLeaderboard, { lastGeneratedAt } from '../../database/account-info/leaderboard.js';
import validateInt from '../validators/int.js';

import { createHash, timingSafeEqual } from 'crypto';
import { Router } from 'express';

// matches the five minute cache in database/account-info/leaderboard.js
const MAX_AGE_SECONDS = 300;

const router = Router();

/**
 * This endpoint returns every user's username and play stats, so it is gated
 * behind a shared secret rather than served publicly. Set LEADERBOARD_KEY in
 * the environment and share it only with sites you want to have access;
 * requests without a matching ?key= are rejected. If LEADERBOARD_KEY is
 * unset, every request is rejected rather than the endpoint quietly
 * becoming public.
 * @param {unknown} providedKey - req.query.key; unvalidated, so may be anything
 * @returns {boolean}
 */
function isAuthorized (providedKey) {
  const expectedKey = process.env.LEADERBOARD_KEY;
  if (!expectedKey || typeof providedKey !== 'string') { return false; }

  const expected = Buffer.from(expectedKey);
  const provided = Buffer.from(providedKey);
  // encode as a fixed-length hash first so timingSafeEqual doesn't throw
  // and comparing keys of different lengths doesn't leak the true length
  return timingSafeEqual(
    createHash('sha256').update(expected).digest(),
    createHash('sha256').update(provided).digest()
  );
}

router.get('/', async (req, res) => {
  if (!isAuthorized(req.query.key)) {
    res.sendStatus(401);
    return;
  }

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

  // private: a shared/CDN cache must not serve this response to a caller
  // that did not supply its own key
  res.set('Cache-Control', `private, max-age=${MAX_AGE_SECONDS}`);
  res.json({
    leaderboard,
    count: leaderboard.length,
    generatedAt: lastGeneratedAt()
  });
});

export default router;
