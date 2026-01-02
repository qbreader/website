import allRouter from './all.js';
import graphRouter from './graph.js';

import getUserId from '../../../../database/account-info/get-user-id.js';
import getSummaryBonusStats from '../../../../database/account-info/user-stats/get-summary-bonus-stats.js';
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

  const [categoryStats, subcategoryStats, alternateSubcategoryStats, setStats] = await Promise.all([
    await getSummaryBonusStats(userId, 'category', query),
    await getSummaryBonusStats(userId, 'subcategory', query),
    await getSummaryBonusStats(userId, 'alternate_subcategory', query),
    await getSummaryBonusStats(userId, 'set_id', query)
  ]);

  for (const stat of setStats) {
    stat._id = setsById[stat._id] || null;
  }

  res.json({
    'category-stats': categoryStats,
    'subcategory-stats': subcategoryStats,
    'alternate-subcategory-stats': alternateSubcategoryStats,
    'set-stats': setStats
  });
});

router.use('/all', allRouter);
router.use('/graph', graphRouter);

export default router;
