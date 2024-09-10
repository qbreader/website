import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.sendFile('index.html', { root: './client/admin/category-reports' });
});

export default router;
