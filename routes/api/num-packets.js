import { getNumPackets } from '../../database/questions.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const numPackets = await getNumPackets(req.query.setName);
    if (numPackets === 0) {
        res.statusCode = 404;
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.json({ numPackets });
});

export default router;
