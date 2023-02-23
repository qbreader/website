const express = require('express');
const router = express.Router();

router.get('/', (_req, res) => {
    res.sendFile('backups.html', { root: './client' });
});

module.exports = router;
