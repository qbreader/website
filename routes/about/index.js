import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.sendFile('index.html', { root: './client/about' });
});

router.get('/privacy-policy', (req, res) => {
  res.sendFile('privacy-policy.html', { root: './client/about' });
});

router.get('/terms-of-service', (req, res) => {
  res.sendFile('terms-of-service.html', { root: './client/about' });
});

export default router;
