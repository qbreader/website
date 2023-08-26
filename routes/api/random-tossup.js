import { getRandomTossups } from '../../database/questions.js';

import { Router } from 'express';
const router = Router();


router.get('/', async (req, res) => {
    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));

        req.query.difficulties = req.query.difficulties.length ? req.query.difficulties : undefined;
    }

    if (req.query.categories) {
        req.query.categories = req.query.categories.split(',');
        req.query.categories = req.query.categories.length ? req.query.categories : undefined;
    }

    if (req.query.subcategories) {
        req.query.subcategories = req.query.subcategories.split(',');
        req.query.subcategories = req.query.subcategories.length ? req.query.subcategories : undefined;
    }

    req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
    req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);
    req.query.number = isNaN(req.query.number) ? undefined : parseInt(req.query.number);

    req.query.powermarkOnly = (req.query.powermarkOnly === 'true');

    const tossups = await getRandomTossups(req.query);

    if (tossups.length === 0) {
        res.status(404);
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.json({ tossups });
});

export default router;
