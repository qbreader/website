const express = require('express');
const router = express.Router();

const authentication = require('../server/authentication');


function getPageSecurely(htmlFile) {
    return async (req, res) => {
        // don't show page if you're not logged in
        if (!req.session || !authentication.checkToken(req.session.username, req.session.token)) {
            res.redirect('/user/login');
            return;
        }

        res.sendFile(htmlFile, { root: './client/user' });
    };
}

router.get('/edit-profile', getPageSecurely('edit-profile.html'));
router.get('/edit-password', getPageSecurely('edit-password.html'));

router.get('/login', async (req, res) => {
    // don't show login page if you're already logged in
    if (req.session && authentication.checkToken(req.session.username, req.session.token)) {
        res.redirect('/user/my-profile');
        return;
    }

    res.sendFile('login.html', { root: './client/user' });
});


router.get('/my-profile', getPageSecurely('my-profile.html'));

router.get('/signup', async (req, res) => {
    res.sendFile('signup.html', { root: './client/user' });
});

router.get('/stats/bonuses', getPageSecurely('stats/bonuses.html'));

router.get('/stats/database', (req, res) => {
    res.redirect('/user/stats/db');
});

router.get('/stats/db', getPageSecurely('stats/database.html'));
router.get('/stats/tossups', getPageSecurely('stats/tossups.html'));


router.get('/verify-email-failed', async (req, res) => {
    res.sendFile('verify-email-failed.html', { root: './client/user' });
});


module.exports = router;
