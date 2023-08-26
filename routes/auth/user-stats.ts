import { getCategoryStats, getSubcategoryStats, getBestBuzz, getUserId, getBonusGraphStats, getTossupGraphStats } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';

const router = Router();

router.use((req, res, next) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.sendStatus(401);
        return;
    }

    if (!checkToken(username, token, true)) {
        res.sendStatus(403);
        return;
    }

    if (req.query.difficulties) {
        req.query.difficulties = req.query.difficulties
            .split(',')
            .map((difficulty) => parseInt(difficulty));
    }

    req.query.includeMultiplayer = !(req.query.includeMultiplayer === 'false');
    req.query.includeSingleplayer = !(req.query.includeSingleplayer === 'false');
    req.query.startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    req.query.endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    // note that isNaN(null) === true
    if (isNaN(req.query.startDate) || isNaN(req.query.endDate)) {
        res.sendStatus(400);
        return;
    }

    next();
});

router.get('/bonus', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;

    const [categoryStats, subcategoryStats] = await Promise.all([
        await getCategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getSubcategoryStats({ username, questionType: 'bonus', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
    ]);
    res.json({ categoryStats, subcategoryStats });
});


router.get('/tossup', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;

    const [bestBuzz, categoryStats, subcategoryStats] = await Promise.all([
        await getBestBuzz({ username, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getCategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
        await getSubcategoryStats({ username, questionType: 'tossup', difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }),
    ]);
    res.json({ bestBuzz, categoryStats, subcategoryStats });
});

router.get('/bonus-graph', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
    const user_id = await getUserId(username);
    res.json(await getBonusGraphStats({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }));
});

router.get('/tossup-graph', async (req, res) => {
    const { username } = req.session;
    const { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate } = req.query;
    const user_id = await getUserId(username);
    res.json(await getTossupGraphStats({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }));
});

export default router;
