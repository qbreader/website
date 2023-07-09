import * as authentication from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username, token } = req.session;
    if (!authentication.checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    if (await authentication.sendVerificationEmail(username)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export default router;
