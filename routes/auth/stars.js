import getUserId from '../../database/account-info/get-user-id.js';
import getBonusStars from '../../database/account-info/stars/get-bonus-stars.js';
import getTossupStars from '../../database/account-info/stars/get-tossup-stars.js';
import isStarredBonus from '../../database/account-info/stars/is-starred-bonus.js';
import isStarredTossup from '../../database/account-info/stars/is-starred-tossup.js';
import starBonus from '../../database/account-info/stars/star-bonus.js';
import starTossup from '../../database/account-info/stars/star-tossup.js';
import unstarBonus from '../../database/account-info/stars/unstar-bonus.js';
import unstarTossup from '../../database/account-info/stars/unstar-tossup.js';
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

    next();
});

router.get('/bonuses', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const stars = await getBonusStars(user_id);
    res.status(200).json(stars);
});

router.get('/tossups', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const stars = await getTossupStars(user_id);
    res.status(200).json(stars);
});

router.get('/is-starred-bonus', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    try {
        const bonus_id = new ObjectId(req.query.bonus_id);
        res.json({ isStarred: await isStarredBonus(user_id, bonus_id) });
    } catch { // Invalid ObjectID
        res.json({ isStarred: false });
    }
});

router.get('/is-starred-tossup', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    try {
        const tossup_id = new ObjectId(req.query.tossup_id);
        res.json({ isStarred: await isStarredTossup(user_id, tossup_id) });
    } catch { // Invalid ObjectID
        res.json({ isStarred: false });
    }
});

router.put('/star-bonus', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const bonus_id = new ObjectId(req.body.bonus_id);
    await starBonus(user_id, bonus_id);
    res.sendStatus(200);
});

router.put('/star-tossup', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const tossup_id = new ObjectId(req.body.tossup_id);
    await starTossup(user_id, tossup_id);
    res.sendStatus(200);
});

router.put('/unstar-bonus', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const bonus_id = new ObjectId(req.body.bonus_id);
    await unstarBonus(user_id, bonus_id);
    res.sendStatus(200);
});

router.put('/unstar-tossup', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const tossup_id = new ObjectId(req.body.tossup_id);
    await unstarTossup(user_id, tossup_id);
    res.sendStatus(200);
});

export default router;
