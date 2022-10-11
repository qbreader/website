const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('tossups.html', { root: './client/singleplayer' });
});

module.exports = router;
