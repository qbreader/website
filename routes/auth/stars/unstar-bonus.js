import getUserId from '../../../database/account-info/get-user-id.js';
import unstarBonus from '../../../database/account-info/stars/unstar-bonus.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

router.put('/unstar-bonus', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const bonus_id = new ObjectId(req.body.bonus_id);
    await unstarBonus(user_id, bonus_id);
    res.sendStatus(200);
});

export default router;
