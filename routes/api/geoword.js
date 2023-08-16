import * as geoword from '../../database/geoword.js';
import { getUser, getUserId } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';
import checkAnswer from '../../server/checkAnswer.js';

import { Router } from 'express';
import stripeClass from 'stripe';

const router = Router();
const stripe = new stripeClass(process.env.STRIPE_SECRET_KEY);

router.get('/check-answer', async (req, res) => {
    const { givenAnswer, questionNumber, packetName, division } = req.query;
    const answer = await geoword.getAnswer(packetName, division, parseInt(questionNumber));
    const { directive, directedPrompt } = checkAnswer(answer, givenAnswer);
    res.json({ actualAnswer: answer, directive, directedPrompt });
});

router.get('/compare', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const { packetName, division, opponent } = req.query;
    const myBuzzes = await geoword.getBuzzes(packetName, division, await getUserId(username));
    const opponentBuzzes = (await geoword.getBuzzes(packetName, division, await getUserId(opponent))).slice(0, myBuzzes.length);

    res.json({ myBuzzes, opponentBuzzes });
});

router.get('/cost', async (req, res) => {
    const { packetName } = req.query;
    const cost = await geoword.getCost(packetName);
    res.json({ cost });
});

router.post('/create-payment-intent', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const user_id = await getUserId(username);
    const packetName = req.body.packetName;
    const cost = await geoword.getCost(packetName);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        amount: cost, // default $2.50
        currency: 'usd',
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: { user_id: String(user_id), packetName: packetName },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
});


router.get('/division-choice', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const { packetName } = req.query;
    const user_id = await getUserId(username);
    const division = await geoword.getDivisionChoice(packetName, user_id);

    res.json({ division });
});

router.get('/get-progress', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const packetName = req.query.packetName;
    const user_id = await getUserId(username);
    const { division, numberCorrect, points, totalCorrectCelerity, tossupsHeard } = await geoword.getProgress(packetName, user_id);

    res.json({ division, numberCorrect, points, totalCorrectCelerity, tossupsHeard });
});

router.get('/get-divisions', async (req, res) => {
    const divisions = await geoword.getDivisions(req.query.packetName);
    res.json({ divisions });
});

router.get('/leaderboard', async (req, res) => {
    const { packetName, division } = req.query;
    const leaderboard = await geoword.getLeaderboard(packetName, division);
    res.json({ leaderboard });
});

router.get('/packet', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const { packetName, division } = req.query;
    const user = await getUser(username);

    const [buzzCount, questionCount] = await Promise.all([
        geoword.getBuzzCount(packetName, user._id),
        geoword.getQuestionCount(packetName),
    ]);

    if (!user.admin && buzzCount < questionCount) {
        res.sendStatus(403);
        return;
    }

    const packet = await geoword.getPacket(packetName, division);
    res.json({ packet });
});

router.get('/packet-list', async (req, res) => {
    const packetList = await geoword.getPacketList();
    res.json({ packetList });
});

router.get('/get-question-count', async (req, res) => {
    const { packetName, division } = req.query;
    const questionCount = await geoword.getQuestionCount(packetName, division);
    res.json({ questionCount });
});

router.get('/record-buzz', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    req.query.celerity = parseFloat(req.query.celerity);
    req.query.points = parseInt(req.query.points);
    req.query.questionNumber = parseInt(req.query.questionNumber);
    if (req.query.prompts) {
        req.query.prompts = req.query.prompts.split(',');
    }

    const user_id = await getUserId(username);
    const { packetName, questionNumber, celerity, points, prompts, givenAnswer } = req.query;
    const result = await geoword.recordBuzz({ celerity, points, prompts, packetName, questionNumber, givenAnswer, user_id });

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.put('/record-division', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const { packetName, division } = req.body;
    const user_id = await getUserId(username);
    const result = await geoword.recordDivision(packetName, division, user_id);

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.put('/record-protest', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const { packetName, questionNumber } = req.body;
    const user_id = await getUserId(username);
    const result = await geoword.recordProtest(packetName, questionNumber, user_id);

    if (result) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});


router.get('/stats', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    const user_id = await getUserId(username);
    const { packetName } = req.query;
    const { buzzArray, division, leaderboard } = await geoword.getUserStats(packetName, user_id);
    res.json({ buzzArray, division, leaderboard });
});

export default router;
