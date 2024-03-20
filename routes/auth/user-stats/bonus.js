import getAlternateSubcategoryStats from '../../../database/account-info/user-stats/get-alternate-subcategory-stats.js';
import getCategoryStats from '../../../database/account-info/user-stats/get-category-stats.js';
import getSubcategoryStats from '../../../database/account-info/user-stats/get-subcategory-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;

    const [categoryStats, subcategoryStats, alternateSubcategoryStats] = await Promise.all([
        await getCategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getSubcategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getAlternateSubcategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
    ]);

    res.json({
        'category-stats': categoryStats,
        'subcategory-stats': subcategoryStats,
        'alternate-subcategory-stats': alternateSubcategoryStats,
    });
});

export default router;
