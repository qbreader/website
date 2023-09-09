import { getStars, getUserId, isStarredBonus, isStarredTossup, starBonus, starTossup, unstarBonus, unstarTossup } from '../../database/users.js';
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
    const stars = await getStars(user_id, 'bonus');
    res.status(200).json(stars);
});

router.get('/tossups', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const stars = await getStars(user_id, 'tossup');
    res.status(200).json(stars);
});

router.get('/is-starred-bonus', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const bonus_id = new ObjectId(req.query.bonus_id);
    res.json({ isStarred: await isStarredBonus(user_id, bonus_id) });
});

router.get('/is-starred-tossup', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const tossup_id = new ObjectId(req.query.tossup_id);
    res.json({ isStarred: await isStarredTossup(user_id, tossup_id) });
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
