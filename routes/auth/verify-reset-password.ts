import { verifyResetPasswordLink } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { user_id, token } = req.query;
    const verified = verifyResetPasswordLink(user_id, token);
    if (verified) {
        req.session.user_id = user_id;
        req.session.verifyResetPassword = true;
        res.redirect('/user/reset-password');
    } else {
        res.redirect('/user/verify-failed');
    }
});

export default router;
