import { getPacketList } from '../../../database/geoword.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const packetList = await getPacketList();
    res.json({ packetList });
});

export default router;
