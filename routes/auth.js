const express = require('express');
const router = express.Router();

const { checkPassword, checkToken, generateToken, saltAndHashPassword, sendVerificationEmail, updatePassword, verifyEmailLink, sendResetPasswordEmail, verifyResetPasswordLink } = require('../server/authentication');
const { ObjectId } = require('mongodb');
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

    if (await userDB.updateUser(username, req.body)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
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


router.get('/get-username', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session.username;
        delete req.session.token;
        res.sendStatus(401);
        return;
    }

    res.send(JSON.stringify({ username }));
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
        console.log(`/api/auth: LOGIN: User ${username} failed to log in.`);
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


router.post('/record-tossup', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const results = await userDB.recordTossupData(username, req.body);
    res.send(JSON.stringify(results));
});


router.post('/reset-password', async (req, res) => {
    const { user_id, verifyResetPassword } = req.session;
    if (!verifyResetPassword) {
        res.sendStatus(401);
        return;
    }

    const username = await userDB.getUsername(new ObjectId(user_id));
    const password = req.body.password;
    await updatePassword(username, password);
    req.session = null;
    res.redirect(200, '/user/login');

    console.log(`/api/auth: RESET-PASSWORD: User ${username} successfully reset their password.`);
});


router.get('/send-password-reset-email', async (req, res) => {
    if (await sendResetPasswordEmail(req.query.username)) {
        res.redirect(200, '/');
    } else {
        res.redirect(500, '/');
    }
});


router.get('/send-verification-email', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session.username;
        delete req.session.token;
        res.sendStatus(401);
        return;
    }

    if (await sendVerificationEmail(username)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
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
    const { user_id, token } = req.query;
    const verified = verifyEmailLink(user_id, token);
    if (verified) {
        req.session = null;
        res.redirect('/user/login');
    } else {
        res.redirect('/user/verify-failed');
    }
});


router.get('/verify-reset-password', (req, res) => {
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


router.get('/stats/single-bonus', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const stats = await userDB.getSingleBonusStats(new ObjectId(req.query.bonus_id));
    res.send(JSON.stringify({ stats }));
});


router.get('/stats/single-tossup', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    const stats = await userDB.getSingleTossupStats(new ObjectId(req.query.tossup_id));
    res.send(JSON.stringify({ stats }));
});


router.get('/user-stats/bonus', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));
    }

    req.query.includeMultiplayer = req.query.includeMultiplayer === 'true';
    req.query.includeSingleplayer = req.query.includeSingleplayer === 'true';

    const { difficulties, setName, includeMultiplayer, includeSingleplayer } = req.query;

    const [categoryStats, subcategoryStats] = await Promise.all([
        await userDB.getCategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer }),
        await userDB.getSubcategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer }),
    ]);
    res.send(JSON.stringify({ categoryStats, subcategoryStats }));
});


router.get('/user-stats/tossup', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token, true)) {
        res.sendStatus(401);
        return;
    }

    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));
    }

    req.query.includeMultiplayer = req.query.includeMultiplayer === 'true';
    req.query.includeSingleplayer = req.query.includeSingleplayer === 'true';

    const { difficulties, setName, includeMultiplayer, includeSingleplayer } = req.query;

    const [bestBuzz, categoryStats, subcategoryStats] = await Promise.all([
        await userDB.getBestBuzz({ username, difficulties, setName, includeMultiplayer, includeSingleplayer }),
        await userDB.getCategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer }),
        await userDB.getSubcategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer }),
    ]);
    res.send(JSON.stringify({ bestBuzz, categoryStats, subcategoryStats }));
});


module.exports = router;