import { verifyEmailLink } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { user_id, token } = req.query;
    const verified = verifyEmailLink(user_id, token);

    if (verified) {
        req.session = null;
        res.redirect('/user/login');
    } else {
        res.redirect('/user/verify-failed');
    }
});

export default router;
