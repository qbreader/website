const express = require('express');
const router = express.Router();

const { checkPassword, checkToken, generateToken, saltAndHashPassword, sendVerificationEmail, updatePassword, verifyEmailLink } = require('../server/authentication');
const userDB = require('../database/users');

const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
    windowMs: 1000, // 4 seconds
    max: 20, // Limit each IP to 20 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


// Apply the rate limiting middleware to API calls only
router.use(apiLimiter);

router.post('/edit-profile', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session.username;
        delete req.session.token;
        res.sendStatus(401);
        return;
    }

    // log out user
    req.session = null;

    userDB.updateUser(username, req.body);
    res.sendStatus(200);
});


router.post('/edit-password', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session.username;
        delete req.session.token;
        res.sendStatus(401);
        return;
    }

    if (!(await checkPassword(username, req.body.oldPassword))) {
        res.sendStatus(403);
        return;
    }

    await updatePassword(username, req.body.newPassword);
    req.session.username = username;
    req.session.token = generateToken(username);
    res.sendStatus(200);
});


router.get('/get-profile', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session.username;
        delete req.session.token;
        res.sendStatus(401);
        return;
    }

    const user = await userDB.getUser(username);
    res.send(JSON.stringify({ user }));
});


router.get('/get-stats-bonus', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const [categoryStats, subcategoryStats] = await Promise.all([
        await userDB.getCategoryStats(username, 'bonus'),
        await userDB.getSubcategoryStats(username, 'bonus'),
    ]);
    res.send(JSON.stringify({ categoryStats, subcategoryStats }));
});


router.get('/get-stats-database', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const [queries] = await Promise.all([
        await userDB.getQueries(username)
    ]);
    res.send(JSON.stringify({ queries }));
});


router.get('/get-stats-tossup', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const [bestBuzz, categoryStats, subcategoryStats] = await Promise.all([
        await userDB.getBestBuzz(username),
        await userDB.getCategoryStats(username, 'tossup'),
        await userDB.getSubcategoryStats(username, 'tossup'),
    ]);
    res.send(JSON.stringify({ bestBuzz, categoryStats, subcategoryStats }));
});


router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (await checkPassword(username, password)) {
        req.session.username = username;
        const verifiedEmail = await userDB.getUserField(username, 'verifiedEmail');
        req.session.token = generateToken(username, verifiedEmail);
        console.log(`/api/auth: LOGIN: User ${username} successfully logged in.`);
        res.sendStatus(200);
    } else {
        console.log(`/api/auth: LOGIN: User ${username} failed to log in. Attempted password: ${password}`);
        res.sendStatus(401);
    }
});


router.post('/logout', (req, res) => {
    console.log(`/api/auth: LOGOUT: User ${req.session.username} successfully logged out.`);
    req.session = null;
    res.sendStatus(200);
});


router.post('/record-bonus', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const results = await userDB.recordBonusData(username, req.body);
    res.send(JSON.stringify(results));
});


router.post('/record-query', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const query = req.body;
    const results = await userDB.recordQuery(username, query);
    res.send(JSON.stringify(results));
});


router.post('/record-tossup', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const results = await userDB.recordTossupData(username, req.body);
    res.send(JSON.stringify(results));
});


router.get('/send-verification-email', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session.username;
        delete req.session.token;
        res.sendStatus(401);
        return;
    }

    sendVerificationEmail(username);
    res.sendStatus(200);
});


router.post('/signup', async (req, res) => {
    const username = req.body.username;

    // return error if username already exists
    const results = await userDB.getUser(username);
    if (results) {
        console.log(`/api/auth: SIGNUP: User ${username} failed to sign up. That username is taken.`);
        res.sendStatus(409);
    } else {
        // log the user in when they sign up
        req.session.username = username;
        req.session.token = generateToken(username);

        const password = saltAndHashPassword(req.body.password);
        const email = req.body.email;
        await userDB.createUser(username, password, email);
        console.log(`/api/auth: SIGNUP: User ${username} successfully signed up.`);
        res.sendStatus(200);
    }
});


router.get('/verify-email', async (req, res) => {
    const verified = verifyEmailLink(req.query.user_id, req.query.token);
    if (verified) {
        req.session = null;
        res.redirect('/user/login');
    } else {
        res.redirect('/user/verify-email-failed');
    }
});


module.exports = router;
