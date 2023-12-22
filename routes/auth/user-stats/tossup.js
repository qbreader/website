import getBestBuzz from '../../../database/account-info/stats/get-best-buzz.js';
import getCategoryStats from '../../../database/account-info/stats/get-category-stats.js';
import getSubcategoryStats from '../../../database/account-info/stats/get-subcategory-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;

    const [bestBuzz, categoryStats, subcategoryStats] = await Promise.all([
        await getBestBuzz({ username, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getCategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getSubcategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
    ]);
    res.json({ bestBuzz, categoryStats, subcategoryStats });
});

export default router;
