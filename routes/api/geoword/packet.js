import { getBuzzCount, getQuestionCount, getPacket } from '../../../database/geoword.js';
import { getUser } from '../../../database/users.js';
import { checkToken } from '../../../server/authentication.js';
import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username, token } = req.session;
    if (!checkToken(username, token)) {
        delete req.session;
        res.redirect('/geoword/login');
        return;
    }

    const { packetName, division } = req.query;
    const user = await getUser(username);

    const [buzzCount, questionCount] = await Promise.all([
        getBuzzCount(packetName, user._id),
        getQuestionCount(packetName),
    ]);

    if (!user.admin && buzzCount < questionCount) {
        res.sendStatus(403);
        return;
    }

    const packet = await getPacket(packetName, division);
    res.json({ packet });
});

export default router;
