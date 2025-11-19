import { Router } from 'express';
const router = Router();

// only match paths that don't have a file extension
router.get(/^\/[^.]+$/, (req, res) => {
  res.sendFile('room.html', { root: './client/play/tossups/mp' });
});

export default router;
