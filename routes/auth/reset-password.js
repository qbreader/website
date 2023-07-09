import * as userDB from '../../database/users.js';
import * as authentication from '../../server/authentication.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.post('/', async (req, res) => {
    const { user_id, verifyResetPassword } = req.session;
    if (!verifyResetPassword) {
        res.sendStatus(401);
        return;
    }

    const username = await userDB.getUsername(new ObjectId(user_id));
    const password = req.body.password;
    await authentication.updatePassword(username, password);
    req.session = null;
    res.redirect(200, '/user/login');

    console.log(`/api/auth: RESET-PASSWORD: User ${username} successfully reset their password.`);
});

export default router;
