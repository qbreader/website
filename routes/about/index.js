import privacyPolicyRouter from './privacy-policy.js';

import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/about' });
});

router.use('/privacy-policy', privacyPolicyRouter);

export default router;
