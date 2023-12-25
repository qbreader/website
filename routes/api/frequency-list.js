import getFrequencyList from '../../database/qbreader/get-frequency-list.js';

import { Router } from 'express';

const router = Router();

router.use('/', async (req, res) => {
    if (isFinite(req.query.limit)) {
        req.query.limit = parseInt(req.query.limit);
    } else {
        req.query.limit = undefined;
    }

    const { limit, subcategory } = req.query;
    const frequencyList = await getFrequencyList(subcategory, limit);
    res.json({ frequencyList });
});

export default router;
