import { DEFAULT_QUERY_RETURN_LENGTH } from '../../constants.js';
import { getQuery } from '../../database/questions.js';

import { Router } from 'express';
const router = Router();


router.get('/', async (req, res) => {
    req.query.randomize = (req.query.randomize === 'true');
    req.query.regex = (req.query.regex === 'true');
    req.query.exactPhrase = (req.query.exactPhrase === 'true');
    req.query.ignoreDiacritics = (req.query.ignoreDiacritics === 'true');

    if (!['tossup', 'bonus', 'all'].includes(req.query.questionType)) {
        res.status(400).send('Invalid question type specified.');
        return;
    }

    if (!['all', 'question', 'answer'].includes(req.query.searchType)) {
        res.status(400).send('Invalid search type specified.');
        return;
    }

    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));
    }

    if (req.query.categories) {
        req.query.categories = req.query.categories.split(',');
    }

    if (req.query.subcategories) {
        req.query.subcategories = req.query.subcategories.split(',');
    }

    if (!req.query.tossupPagination) {
        req.query.tossupPagination = 1;
    }

    if (!req.query.bonusPagination) {
        req.query.bonusPagination = 1;
    }

    if (!isFinite(req.query.tossupPagination) || !isFinite(req.query.bonusPagination)) {
        res.status(400).send('Invalid pagination specified.');
        return;
    }

    if (!req.query.maxReturnLength || isNaN(req.query.maxReturnLength)) {
        req.query.maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;
    }

    const maxPagination = Math.floor(4000 / (req.query.maxReturnLength || 25));

    // bound pagination between 1 and maxPagination
    req.query.tossupPagination = Math.min(parseInt(req.query.tossupPagination), maxPagination);
    req.query.bonusPagination = Math.min(parseInt(req.query.bonusPagination), maxPagination);
    req.query.tossupPagination = Math.max(req.query.tossupPagination, 1);
    req.query.bonusPagination = Math.max(req.query.bonusPagination, 1);

    req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
    req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);

    const queryResult = await getQuery(req.query);
    res.send(JSON.stringify(queryResult));
});


export default router;
