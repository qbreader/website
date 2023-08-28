import { getRandomName } from '../../database/questions.js';

import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    const randomName = getRandomName();
    res.header('Access-Control-Allow-Origin', '*');
    res.json({ randomName });
});

export default router;
