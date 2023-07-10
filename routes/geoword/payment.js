import * as geoword from '../../database/geoword.js';

import { Router } from 'express';

const router = Router();

router.get('/:packetName', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const paid = await geoword.checkPayment({ packetName, username });

    if (paid) {
        res.redirect('/geoword/division/' + packetName);
        return;
    }

    res.sendFile('payment.html', { root: './client/geoword' });
});

export default router;
