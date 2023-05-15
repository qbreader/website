const express = require('express');
const router = express.Router();

const { checkPassword, checkToken, generateToken, saltAndHashPassword, updatePassword } = require('../server/authentication');
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
        res.sendStatus(401);
        return;
    }

    // log out if player changed their username
    if (username != req.body.username)
        req.session = null;

    userDB.updateUser(username, req.body);
    res.sendStatus(200);
});


router.post('/edit-password', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        res.sendStatus(401);
        return;
    }

    if (!(await checkPassword(username, req.body.oldPassword))) {
        res.sendStatus(403);
        return;
    }

    await updatePassword(username, req.body.newPassword);
    res.sendStatus(200);
});



router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (await checkPassword(username, password)) {
        req.session.username = username;
        req.session.token = generateToken(username);
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


router.get('/my-profile', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        res.sendStatus(401);
        return;
    }

    const [queries, bestBuzz] = await Promise.all([
        await userDB.getQueries(username),
        await userDB.getBestBuzz(username)
    ]);
    res.send(JSON.stringify({ queries, bestBuzz }));
});


router.post('/record-query', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        res.sendStatus(401);
        return;
    }

    const query = req.body;
    const results = await userDB.recordQuery(username, query);
    res.send(JSON.stringify(results));
});


router.post('/record-tossup-data', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        res.sendStatus(401);
        return;
    }

    console.log(req.body);
    const results = await userDB.recordTossupData(username, req.body);
    res.send(JSON.stringify(results));
});


router.post('/signup', async (req, res) => {
    const username = req.body.username;

    // return error if username already exists
    const results = await userDB.getUser(username);
    if (results) {
        console.log(`/api/auth: SIGNUP: User ${username} failed to sign up.`);
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


module.exports = router;
