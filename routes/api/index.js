import { getNumPackets, getPacket, getRandomName, reportQuestion, getSetList } from '../../database/questions.js';
import checkAnswer from '../../server/checkAnswer.js';

import geowordRouter from './geoword.js';
import multiplayerRouter from './multiplayer.js';
import queryRouter from './query.js';
import randomBonusRouter from './random-bonus.js';
import randomTossupRouter from './random-tossup.js';

import { Router } from 'express';
import rateLimit from 'express-rate-limit';


const router = Router();
// Apply the rate limiting middleware to API calls only
router.use(rateLimit({
    windowMs: 1000, // 4 seconds
    max: 20, // Limit each IP to 20 requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}));


// express encodes same parameter passed multiple times as an array
// this middleware converts it to a single value
router.use((req, _res, next) => {
    for (const key in req.query) {
        if (Array.isArray(req.query[key])) {
            req.query[key] = req.query[key][0];
        }
    }
    next();
});

router.get('/check-answer', (req, res) => {
    const { answerline, givenAnswer } = req.query;
    const { directive, directedPrompt } = checkAnswer(answerline, givenAnswer);
    res.json({ directive, directedPrompt });
});

router.use('/geoword', geowordRouter);

router.use('/multiplayer', multiplayerRouter);

router.get('/num-packets', async (req, res) => {
    const numPackets = await getNumPackets(req.query.setName);
    if (numPackets === 0) {
        res.statusCode = 404;
    }
    res.json({ numPackets });
});

router.get('/packet', async (req, res) => {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const packet = await getPacket({ setName, packetNumber });
    if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
        res.statusCode = 404;
    }
    res.json(packet);
});

router.get('/packet-bonuses', async (req, res) => {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const packet = await getPacket({ setName, packetNumber, questionTypes: ['bonuses'] });
    if (packet.bonuses.length === 0) {
        res.statusCode = 404;
    }
    res.json(packet);
});

router.get('/packet-tossups', async (req, res) => {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const packet = await getPacket({ setName, packetNumber, questionTypes: ['tossups'] });
    if (packet.tossups.length === 0) {
        res.statusCode = 404;
    }
    res.json(packet);
});

router.use('/query', queryRouter);

router.get('/random-name', (req, res) => {
    const randomName = getRandomName();
    res.json({ randomName: randomName });
});

router.use('/random-bonus', randomBonusRouter);

router.use('/random-tossup', randomTossupRouter);

router.post('/report-question', async (req, res) => {
    const _id = req.body._id;
    const reason = req.body.reason ?? '';
    const description = req.body.description ?? '';
    const successful = await reportQuestion(_id, reason, description);
    if (successful) {
        res.sendStatus(200);
    } else {
        res.sendStatus(500);
    }
});

router.get('/set-list', (req, res) => {
    const setList = getSetList();
    res.json({ setList });
});

export default router;
