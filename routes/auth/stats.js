import { getSingleBonusStats, getSingleTossupStats } from '../../database/users.js';
import { checkToken } from '../../server/authentication.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

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

    next();
});

router.get('/single-bonus', async (req, res) => {
    const stats = await getSingleBonusStats(new ObjectId(req.query.bonus_id));
    res.json({ stats });
});


router.get('/single-tossup', async (req, res) => {
    const stats = await getSingleTossupStats(new ObjectId(req.query.tossup_id));
    res.json({ stats });
});

export default router;
