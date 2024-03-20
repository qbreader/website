import recordBonusRouter from './record-bonus.js';
import recordTossupRouter from './record-tossup.js';
import singleBonusRouter from './single-bonus.js';
import singleTossupRouter from './single-tossup.js';

import { checkToken } from '../../../server/authentication.js';

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

    next();
});

router.use('/record-bonus', recordBonusRouter);
router.use('/record-tossup', recordTossupRouter);
router.use('/single-bonus', singleBonusRouter);
router.use('/single-tossup', singleTossupRouter);

export default router;
