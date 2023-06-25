import { isAdmin } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.use(async (req, res, next) => {
    const { username, token } = req.session;

    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const admin = await isAdmin(username);

    if (!admin) {
        res.redirect('/geoword');
        return;
    }

    next();
});

router.get('/', async (req, res) => {
    res.sendFile('index.html', { root: './client/geoword/admin' });
});

router.get('/protests/:packetName/:division', async (req, res) => {
    res.sendFile('protests.html', { root: './client/geoword/admin' });
});

router.get('/stats/:packetName/:division', async (req, res) => {
    res.sendFile('stats.html', { root: './client/geoword/admin' });
});

export default router;
