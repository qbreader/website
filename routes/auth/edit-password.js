import { COOKIE_MAX_AGE } from '../../constants.js';
import { getUserField } from '../../database/users.js';
import { checkToken, checkPassword, updatePassword, generateToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    if (!(await checkPassword(username, req.body.oldPassword))) {
        res.sendStatus(403);
        return;
    }

    await updatePassword(username, req.body.newPassword);

    const expires = Date.now() + COOKIE_MAX_AGE;
    const verifiedEmail = await getUserField(username, 'verifiedEmail');
    req.session.username = username;
    req.session.token = generateToken(username, verifiedEmail);
    req.session.expires = expires;
    res.status(200).send(JSON.stringify({ expires }));
});

export default router;
