import * as geoword from '../../database/geoword.js';
import { getUserId } from '../../database/users.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const user_id = await getUserId(username);

    const division = await geoword.getDivisionChoice(packetName, user_id);

    if (!division) {
        res.redirect('/geoword/division/' + packetName);
        return;
    }

    const paid = await geoword.checkPayment(packetName, user_id);

    if (!paid) {
        res.redirect('/geoword/payment/' + packetName);
        return;
    }

    const [buzzCount, questionCount] = await Promise.all([
        geoword.getBuzzCount(packetName, user_id),
        geoword.getQuestionCount(packetName, division),
    ]);

    if (buzzCount >= questionCount) {
        res.redirect('/geoword/stats/' + packetName);
        return;
    }

    res.sendFile('game.html', { root: './client/geoword' });
});

export default router;
