import getCost from '../../../database/geoword/get-cost.js';

import { Router } from 'express';
const router = Router();

router.get('/', async (req, res) => {
    const { packetName } = req.query;
    const cost = await getCost(packetName);
    res.json({ cost });
});

export default router;
