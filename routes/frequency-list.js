import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/frequency-list' });
});

router.get('/:subcategory', (req, res) => {
    res.sendFile('subcategory.html', { root: './client/frequency-list' });
});

export default router;
