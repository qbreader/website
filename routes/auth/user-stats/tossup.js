import getAlternateSubcategoryStats from '../../../database/account-info/user-stats/get-alternate-subcategory-stats.js';
import getBestBuzz from '../../../database/account-info/user-stats/get-best-buzz.js';
import getCategoryStats from '../../../database/account-info/user-stats/get-category-stats.js';
import getSubcategoryStats from '../../../database/account-info/user-stats/get-subcategory-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;

    const [bestBuzz, categoryStats, subcategoryStats, alternateSubcategoryStats] = await Promise.all([
        await getBestBuzz({ username, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getCategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getSubcategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getAlternateSubcategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
    ]);

    res.json({
        'best-buzz': bestBuzz,
        'category-stats': categoryStats,
        'subcategory-stats': subcategoryStats,
        'alternate-subcategory-stats': alternateSubcategoryStats,
    });
});

export default router;
