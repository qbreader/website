import { DEFAULT_QUERY_RETURN_LENGTH } from '../constants.js';
import { getNumPackets, getPacket, getQuery, getRandomName, getRandomBonuses, getRandomTossups, reportQuestion, getSetList } from '../database/questions.js';
import checkAnswer from '../server/checkAnswer.js';
import { tossupRooms } from '../server/TossupRoom.js';

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
    res.send(JSON.stringify({ directive: directive, directedPrompt: directedPrompt }));
});


router.get('/num-packets', async (req, res) => {
    const numPackets = await getNumPackets(req.query.setName);
    if (numPackets === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify({ numPackets: numPackets }));
});


router.get('/packet', async (req, res) => {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const packet = await getPacket({ setName, packetNumber });
    if (packet.tossups.length === 0 && packet.bonuses.length === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify(packet));
});


router.get('/packet-bonuses', async (req, res) => {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const packet = await getPacket({ setName, packetNumber, questionTypes: ['bonuses'] });
    if (packet.bonuses.length === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify(packet));
});


router.get('/packet-tossups', async (req, res) => {
    const setName = req.query.setName;
    const packetNumber = parseInt(req.query.packetNumber);
    const packet = await getPacket({ setName, packetNumber, questionTypes: ['tossups'] });
    if (packet.tossups.length === 0) {
        res.statusCode = 404;
    }
    res.send(JSON.stringify(packet));
});


router.get('/query', async (req, res) => {
    req.query.randomize = (req.query.randomize === 'true');
    req.query.regex = (req.query.regex === 'true');
    req.query.ignoreDiacritics = (req.query.ignoreDiacritics === 'true');

    if (!['tossup', 'bonus', 'all'].includes(req.query.questionType)) {
        res.status(400).send('Invalid question type specified.');
        return;
    }

    if (!['all', 'question', 'answer'].includes(req.query.searchType)) {
        res.status(400).send('Invalid search type specified.');
        return;
    }

    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));
    }

    if (req.query.categories) {
        req.query.categories = req.query.categories.split(',');
    }

    if (req.query.subcategories) {
        req.query.subcategories = req.query.subcategories.split(',');
    }

    if (!req.query.tossupPagination) {
        req.query.tossupPagination = 1;
    }

    if (!req.query.bonusPagination) {
        req.query.bonusPagination = 1;
    }

    if (!isFinite(req.query.tossupPagination) || !isFinite(req.query.bonusPagination)) {
        res.status(400).send('Invalid pagination specified.');
        return;
    }

    if (!req.query.maxReturnLength || isNaN(req.query.maxReturnLength)) {
        req.query.maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;
    }

    const maxPagination = Math.floor(4000 / (req.query.maxReturnLength || 25));

    // bound pagination between 1 and maxPagination
    req.query.tossupPagination = Math.min(parseInt(req.query.tossupPagination), maxPagination);
    req.query.bonusPagination = Math.min(parseInt(req.query.bonusPagination), maxPagination);
    req.query.tossupPagination = Math.max(req.query.tossupPagination, 1);
    req.query.bonusPagination = Math.max(req.query.bonusPagination, 1);

    req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
    req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);

    const queryResult = await getQuery(req.query);
    res.send(JSON.stringify(queryResult));
});


router.get('/random-name', (req, res) => {
    const randomName = getRandomName();
    res.send(JSON.stringify({ randomName: randomName }));
});


router.get('/random-bonus', async (req, res) => {
    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));

        req.query.difficulties = req.query.difficulties.length ? req.query.difficulties : undefined;
    }

    if (req.query.categories) {
        req.query.categories = req.query.categories.split(',');
        req.query.categories = req.query.categories.length ? req.query.categories : undefined;
    }

    if (req.query.subcategories) {
        req.query.subcategories = req.query.subcategories.split(',');
        req.query.subcategories = req.query.subcategories.length ? req.query.subcategories : undefined;
    }

    req.query.bonusLength = (req.query.threePartBonuses === 'true') ? 3 : undefined;

    req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
    req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);
    req.query.number = isNaN(req.query.number) ? undefined : parseInt(req.query.number);

    const bonuses = await getRandomBonuses(req.query);
    if (bonuses.length === 0) {
        res.status(404);
    }
    res.send(JSON.stringify({ bonuses: bonuses }));
});


router.get('/random-tossup', async (req, res) => {
    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));

        req.query.difficulties = req.query.difficulties.length ? req.query.difficulties : undefined;
    }

    if (req.query.categories) {
        req.query.categories = req.query.categories.split(',');
        req.query.categories = req.query.categories.length ? req.query.categories : undefined;
    }

    if (req.query.subcategories) {
        req.query.subcategories = req.query.subcategories.split(',');
        req.query.subcategories = req.query.subcategories.length ? req.query.subcategories : undefined;
    }

    req.query.minYear = isNaN(req.query.minYear) ? undefined : parseInt(req.query.minYear);
    req.query.maxYear = isNaN(req.query.maxYear) ? undefined : parseInt(req.query.maxYear);
    req.query.number = isNaN(req.query.number) ? undefined : parseInt(req.query.number);

    const tossups = await getRandomTossups(req.query);
    if (tossups.length === 0) {
        res.status(404);
    }

    res.send(JSON.stringify({ tossups: tossups }));
});


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
    res.send(JSON.stringify({ setList }));
});


router.get('/multiplayer/room-list', (_req, res) => {
    const roomList = [];
    for (const roomName in tossupRooms) {
        if (!tossupRooms[roomName].settings.public) {
            continue;
        }

        roomList.push({
            roomName: roomName,
            playerCount: Object.keys(tossupRooms[roomName].players).length,
            onlineCount: Object.keys(tossupRooms[roomName].sockets).length,
            isPermanent: tossupRooms[roomName].isPermanent,
        });
    }

    res.send(JSON.stringify({ roomList: roomList }));
});


export default router;
