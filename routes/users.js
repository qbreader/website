const express = require('express');
const router = express.Router();

const authentication = require('../server/authentication');


router.get('/login', async (req, res) => {
    // don't show login page if you're already logged in
    if (req.session && authentication.checkToken(req.session.username, req.session.token)) {
        res.redirect('/');
        return;
    }

    res.sendFile('login.html', { root: './client/users' });
});


router.get('/my-profile', async (req, res) => {
    // don't show profile page if you're not logged in
    if (req.session && authentication.checkToken(req.session.username, req.session.token)) {
        res.sendFile('my-profile.html', { root: './client/users' });
        return;
    }

    res.redirect('/users/login');
});


router.get('/signup', async (req, res) => {
    res.sendFile('signup.html', { root: './client/users' });
});


module.exports = router;
