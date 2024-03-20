import getSingleBonusStats from '../../../database/account-info/question-stats/get-single-bonus-stats.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
    const stats = await getSingleBonusStats(new ObjectId(req.query.bonus_id));
    res.json({ stats });
});

export default router;
