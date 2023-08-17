import { checkToken } from '../server/authentication.js';

import { Router } from 'express';


const router = Router();

function getPageSecurely(htmlFile) {
    return async (req, res) => {
        // don't show page if you're not logged in
        if (!req.session || !checkToken(req.session.username, req.session.token)) {
            res.redirect('/user/login');
            return;
        }

        res.sendFile(htmlFile, { root: './client/user' });
    };
}

router.get('/edit-profile', getPageSecurely('edit-profile.html'));
router.get('/edit-password', getPageSecurely('edit-password.html'));

router.get('/forgot-password', async (req, res) => {
    res.sendFile('forgot-password.html', { root: './client/user' });
});

router.get('/login', async (req, res) => {
    // don't show login page if you're already logged in
    if (req.session && checkToken(req.session.username, req.session.token)) {
        res.redirect('/user/my-profile');
        return;
    }

    res.sendFile('login.html', { root: './client/user' });
});


router.get('/my-profile', getPageSecurely('my-profile.html'));

router.get('/reset-password', async (req, res) => {
    res.sendFile('reset-password.html', { root: './client/user' });
});

router.get('/signup', async (req, res) => {
    res.sendFile('signup.html', { root: './client/user' });
});

router.get('/stats/bonus-graph', getPageSecurely('stats/bonus-graph.html'));
router.get('/stats/bonuses', getPageSecurely('stats/bonuses.html'));
router.get('/stats/tossups', getPageSecurely('stats/tossups.html'));
router.get('/stats/tossup-graph', getPageSecurely('stats/tossup-graph.html'));

router.get('/verify-failed', async (req, res) => {
    res.sendFile('verify-failed.html', { root: './client/user' });
});


export default router;
