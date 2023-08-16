import * as geoword from '../../database/geoword.js';
import { getUserId } from '../../database/users.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const user_id = await getUserId(username);

    const paid = await geoword.checkPayment(packetName, user_id);

    if (paid) {
        res.sendFile('packet.html', { root: './client/geoword' });
        return;
    }

    res.redirect('/geoword/payment/' + packetName);
});

export default router;
