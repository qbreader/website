import * as geoword from '../../database/geoword.js';

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    const { username } = req.session;
    const packetName = req.params.packetName;
    const paid = await geoword.checkPayment({ packetName, username });

    if (paid) {
        res.sendFile('compare.html', { root: './client/geoword' });
        return;
    }

    res.redirect('/geoword/payment/' + packetName);
});

export default router;
