import getUserId from '../../database/account-info/get-user-id.js';
import checkPayment from '../../database/geoword/check-payment.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const user_id = await getUserId(username);

    const paid = await checkPayment(packetName, user_id);

    if (!paid) {
        res.redirect('/geoword/payment/' + packetName);
        return;
    }

    res.sendFile('stats.html', { root: './client/geoword' });
});

export default router;
