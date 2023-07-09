import * as authentication from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username, token, expires } = req.session;
    if (!authentication.checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    res.json({ username, expires });
});

export default router;
