import * as userDB from '../../database/users.js';
import * as authentication from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
    const { username, token } = req.session;
    if (!authentication.checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    if (!authentication.checkToken(username, token, true)) {
        res.sendStatus(403);
        return;
    }

    const results = await userDB.recordBonusData(username, req.body);
    res.json(results);
});

export default router;
