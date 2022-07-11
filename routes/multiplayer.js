const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile('multiplayer.html', { root: './static' });
});

router.get('/*', (req, res) => {
    res.sendFile('room.html', { root: './static' });
})

module.exports = router;