import { Router } from 'express';
const router = Router();

router.get('/', (_req, res) => {
    res.sendFile('backups.html', { root: './client' });
});

export default router;
