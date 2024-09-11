import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  res.sendFile('index.html', { root: './client/admin/leaderboard' });
});

export default router;
