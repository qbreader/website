const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client' });
});

router.get('/api-info', (req, res) => {
    res.redirect('/api-docs');
});

module.exports = router;
