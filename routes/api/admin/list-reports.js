import { getReports } from '../../../database/questions.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { reason } = req.query;
    return res.json(await getReports(reason));
});

export default router;
