const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('tossups.html', { root: './client/singleplayer/tossups' });
});

module.exports = router;