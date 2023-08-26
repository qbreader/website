import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
    res.sendFile('index.html', { root: './client/admin/geoword' });
});

router.get('/compare', async (req, res) => {
    res.sendFile('compare.html', { root: './client/admin/geoword' });
});

router.get('/leaderboard/:packetName', async (req, res) => {
    res.sendFile('leaderboard.html', { root: './client/admin/geoword' });
});

router.get('/protests/:packetName/:division', async (req, res) => {
    res.sendFile('protests.html', { root: './client/admin/geoword' });
});

router.get('/stats/:packetName/:division', async (req, res) => {
    res.sendFile('stats.html', { root: './client/admin/geoword' });
});

export default router;
