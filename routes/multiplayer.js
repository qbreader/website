import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './client/multiplayer' });
});

// only match paths that don't have a file extension
router.get(/^\/[^.]*$/, (req, res) => {
  res.sendFile('room.html', { root: './client/multiplayer' });
});

export default router;
