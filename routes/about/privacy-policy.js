import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('privacy-policy.html', { root: './client/about' });
});

export default router;
