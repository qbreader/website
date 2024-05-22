import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('terms-of-use.html', { root: './client/about' });
});

export default router;
