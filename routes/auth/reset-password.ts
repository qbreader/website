import { getUsername } from '../../database/users.js';
import { updatePassword } from '../../server/authentication.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.post('/', async (req, res) => {
    const { user_id, verifyResetPassword } = req.session;
    if (!verifyResetPassword) {
        res.sendStatus(401);
        return;
    }

    const username = await getUsername(new ObjectId(user_id));
    const password = req.body.password;
    await updatePassword(username, password);
    req.session = null;
    res.redirect(200, '/user/login');

    console.log(`/api/auth: RESET-PASSWORD: User ${username} successfully reset their password.`);
});

export default router;
