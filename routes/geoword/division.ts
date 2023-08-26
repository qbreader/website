import * as geoword from '../../database/geoword.js';
import { getUserId } from '../../database/users.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const user_id = await getUserId(username);

    const divisionChoice = await geoword.getDivisionChoice(packetName, user_id);

    if (divisionChoice) {
        res.redirect('/geoword/game/' + packetName);
        return;
    }

    const paid = await geoword.checkPayment(packetName, user_id);

    if (paid) {
        res.sendFile('division.html', { root: './client/geoword' });
        return;
    }

    res.redirect('/geoword/payment/' + packetName);
});

export default router;
