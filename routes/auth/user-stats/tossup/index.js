import allRouter from './all.js';
import graphRouter from './graph.js';

import getUserId from '../../../../database/account-info/get-user-id.js';
import getBestBuzz from '../../../../database/account-info/user-stats/get-best-buzz.js';
import getSummaryTossupStats from '../../../../database/account-info/user-stats/get-summary-tossup-stats.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
  const query = { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate };

  const [bestBuzz, categoryStats, subcategoryStats, alternateSubcategoryStats] = await Promise.all([
    await getBestBuzz(userId, query),
    await getSummaryTossupStats(userId, 'category', query),
    await getSummaryTossupStats(userId, 'subcategory', query),
    await getSummaryTossupStats(userId, 'alternate_subcategory', query)
  ]);

  res.json({
    'best-buzz': bestBuzz,
    'category-stats': categoryStats,
    'subcategory-stats': subcategoryStats,
    'alternate-subcategory-stats': alternateSubcategoryStats
  });
});

router.use('/all', allRouter);
router.use('/graph', graphRouter);

export default router;
