const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('tossups.html', { root: './client/singleplayer/' });
});

router.get('/api-info', (req, res) => {
    res.redirect('/api-docs');
});

module.exports = router;
