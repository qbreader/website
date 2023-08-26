import { checkToken, sendVerificationEmail } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    if (await sendVerificationEmail(username)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export default router;
