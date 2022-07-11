const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('tossups.html', { root: './static' });
});

module.exports = router;