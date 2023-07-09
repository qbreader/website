import { sendResetPasswordEmail } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    if (await sendResetPasswordEmail(req.query.username)) {
        res.redirect(200, '/');
    } else {
        res.redirect(500, '/');
    }
});

export default router;
