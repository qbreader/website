import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.sendFile('tossups.html', { root: './client/singleplayer' });
});

export default router;
