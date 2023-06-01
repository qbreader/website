import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client' });
});

router.get('/api-info', (req, res) => {
    res.redirect('/api-docs');
});

export default router;
