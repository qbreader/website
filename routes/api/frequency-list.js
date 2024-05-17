import getFrequencyList from '../../database/qbreader/get-frequency-list.js';

import { Router } from 'express';

const router = Router();

router.use('/', async (req, res) => {
    if (isFinite(req.query.limit)) {
        req.query.limit = parseInt(req.query.limit);
    } else {
        req.query.limit = undefined;
    }

    const { level } = req.query;
    switch (level) {
    case 'middle-school':
        req.query.difficulties = [1];
        break;
    case 'high-school':
        req.query.difficulties = [2, 3, 4, 5];
        break;
    case 'college':
        req.query.difficulties = [6, 7, 8, 9];
        break;
    case 'open':
        req.query.difficulties = [10];
        break;
    case 'all':
    default:
        req.query.difficulties = undefined;
        break;
    }

    if (!req.query.questionType) {
        req.query.questionType = 'all';
    }

    if (!['tossup', 'bonus', 'all'].includes(req.query.questionType)) {
        res.sendStatus(400);
        return;
    }

    const { difficulties, limit, questionType, subcategory } = req.query;

    const frequencyList = await getFrequencyList(subcategory, difficulties, limit, questionType);
    res.json({ frequencyList });
});

export default router;
