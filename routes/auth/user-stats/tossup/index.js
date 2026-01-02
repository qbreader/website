import allRouter from './all.js';
import graphRouter from './graph.js';

import getUserId from '../../../../database/account-info/get-user-id.js';
import getBestBuzz from '../../../../database/account-info/user-stats/get-best-buzz.js';
import getSummaryTossupStats from '../../../../database/account-info/user-stats/get-summary-tossup-stats.js';
import { sets } from '../../../../database/qbreader/collections.js';

import { Router } from 'express';
const router = Router();

const setsById = {};
for (const set of await sets.find({}).toArray()) {
  setsById[set._id] = set.name;
}

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
  const query = { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate };

  const [bestBuzz, categoryStats, subcategoryStats, alternateSubcategoryStats, setStats] = await Promise.all([
    await getBestBuzz(userId, query),
    await getSummaryTossupStats(userId, 'category', query),
    await getSummaryTossupStats(userId, 'subcategory', query),
    await getSummaryTossupStats(userId, 'alternate_subcategory', query),
    await getSummaryTossupStats(userId, 'set_id', query)
  ]);

  for (const stat of setStats) {
    stat._id = setsById[stat._id] || null;
  }

  res.json({
    'best-buzz': bestBuzz,
    'category-stats': categoryStats,
    'subcategory-stats': subcategoryStats,
    'alternate-subcategory-stats': alternateSubcategoryStats,
    'set-stats': setStats
  });
});

router.use('/all', allRouter);
router.use('/graph', graphRouter);

export default router;
