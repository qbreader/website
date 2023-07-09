import { getUser } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const user = await getUser(username);
    res.json({ user });
});

export default router;
