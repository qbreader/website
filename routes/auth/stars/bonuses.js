import getUserId from '../../../database/account-info/get-user-id.js';
import getBonusStars from '../../../database/account-info/stars/get-bonus-stars.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const username = req.session.username;
    const user_id = await getUserId(username);
    const stars = await getBonusStars(user_id);
    res.status(200).json(stars);
});

export default router;
