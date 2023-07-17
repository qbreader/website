import * as geoword from '../../database/geoword.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const division = await geoword.getDivisionChoice(packetName, username);

    if (!division) {
        res.redirect('/geoword/division/' + packetName);
        return;
    }

    const paid = await geoword.checkPayment(packetName, username);

    if (!paid) {
        res.redirect('/geoword/payment/' + packetName);
        return;
    }

    const [buzzCount, questionCount] = await Promise.all([
        geoword.getBuzzCount(packetName, username),
        geoword.getQuestionCount(packetName, division),
    ]);

    if (buzzCount >= questionCount) {
        res.redirect('/geoword/stats/' + packetName);
        return;
    }

    res.sendFile('game.html', { root: './client/geoword' });
});

export default router;
