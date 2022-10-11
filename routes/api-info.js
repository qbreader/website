const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('api-info.html', { root: './client' });
});

module.exports = router;
