import getUserId from '../../../database/account-info/get-user-id.js';
import getSummaryBonusStats from '../../../database/account-info/user-stats/get-summary-bonus-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
  const query = { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate };

  const [categoryStats, subcategoryStats, alternateSubcategoryStats] = await Promise.all([
    await getSummaryBonusStats(userId, 'category', query),
    await getSummaryBonusStats(userId, 'subcategory', query),
    await getSummaryBonusStats(userId, 'alternate_subcategory', query)
  ]);

  res.json({
    'category-stats': categoryStats,
    'subcategory-stats': subcategoryStats,
    'alternate-subcategory-stats': alternateSubcategoryStats
  });
});

export default router;
