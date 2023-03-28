const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('index.html', { root: './client/api-docs' });
});

module.exports = router;
