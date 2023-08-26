import { updateUser } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    // log out user
    req.session = null;

    if (await updateUser(username, req.body)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

export default router;
