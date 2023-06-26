import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client' });
});

router.get('/react(-dom)?/umd/*.js', (req, res) => {
    res.sendFile(req.url, { root: './node_modules' });
});

router.get('/node_modules/*.scss', (req, res) => {
    res.sendFile(req.url.substring(13), { root: './node_modules' });
});

router.get('/*.css', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

router.get('/*.ico', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

router.get('/*.js', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

router.get('/*.jsx', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

router.get('/*.map', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

router.get('/*.png', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

router.get('/*.scss', (req, res) => {
    res.sendFile(req.url.substring(5), { root: './scss' });
});

/**
 * Redirects:
 */
router.get('/*.html', (req, res) => {
    res.redirect(req.url.substring(0, req.url.length - 5));
});

router.get('/api-info', (req, res) => {
    res.redirect('/api-docs');
});

router.get('/database', (_req, res) => {
    res.redirect('/db');
});

router.get('/index', (req, res) => {
    res.redirect('/');
});

router.get('/users', (req, res) => {
    res.redirect(`/user${req.url}`);
});

export default router;
