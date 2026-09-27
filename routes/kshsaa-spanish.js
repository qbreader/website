import { Router, static as serveStatic } from 'express';
import { fileURLToPath } from 'url';

const router = Router();
const directory = fileURLToPath(new URL('../client/kshsaa-spanish/', import.meta.url));

// Canonical trailing slash keeps the trainer's relative asset URLs in this section.
router.get('/', (req, res, next) => {
  if (!req.originalUrl.split('?')[0].endsWith('/')) {
    return res.redirect(302, '/kshsaa-spanish/');
  }
  next();
});

router.use(serveStatic(directory));

export default router;
