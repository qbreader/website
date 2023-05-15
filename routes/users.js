const express = require('express');
const router = express.Router();

const authentication = require('../server/authentication');


function getPageSecurely(htmlFile) {
    return async (req, res) => {
        // don't show page if you're not logged in
        if (!req.session || !authentication.checkToken(req.session.username, req.session.token)) {
            res.redirect('/users/login');
            return;
        }

        res.sendFile(htmlFile, { root: './client/users' });
    };
}

router.get('/edit-profile', getPageSecurely('edit-profile.html'));
router.get('/edit-password', getPageSecurely('edit-password.html'));

router.get('/login', async (req, res) => {
    // don't show login page if you're already logged in
    if (req.session && authentication.checkToken(req.session.username, req.session.token)) {
        res.redirect('/users/my-profile');
        return;
    }

    res.sendFile('login.html', { root: './client/users' });
});


router.get('/my-profile', getPageSecurely('my-profile.html'));

router.get('/signup', async (req, res) => {
    res.sendFile('signup.html', { root: './client/users' });
});


router.get('/verify-email-failed', async (req, res) => {
    res.sendFile('verify-email-failed.html', { root: './client/users' });
});


module.exports = router;
