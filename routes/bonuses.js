const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('bonuses.html', { root: './client/singleplayer/bonuses' });
});

module.exports = router;