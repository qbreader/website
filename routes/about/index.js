import privacyPolicyRouter from './privacy-policy.js';
import termsOfUseRouter from './terms-of-use.js';

import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/about' });
});

router.use('/privacy-policy', privacyPolicyRouter);
router.use('/terms-of-use', termsOfUseRouter);

export default router;
