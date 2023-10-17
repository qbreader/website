import { getSetList } from '../../database/questions.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const setList = await getSetList();
    res.header('Access-Control-Allow-Origin', '*');
    res.json({ setList });
});

export default router;
