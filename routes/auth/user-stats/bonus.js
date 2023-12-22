import getCategoryStats from '../../../database/account-info/stats/get-category-stats.js';
import getSubcategoryStats from '../../../database/account-info/stats/get-subcategory-stats.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;

    const [categoryStats, subcategoryStats] = await Promise.all([
        await getCategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getSubcategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
    ]);
    res.json({ categoryStats, subcategoryStats });
});

export default router;
