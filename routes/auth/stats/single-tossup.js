import getSingleTossupStats from '../../../database/account-info/stats/get-single-tossup-stats.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.get('/', async (req, res) => {
    const stats = await getSingleTossupStats(new ObjectId(req.query.tossup_id));
    res.json({ stats });
});

export default router;
