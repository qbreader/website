const express = require('express');
const router = express.Router();

var rooms = {
    room1: {
        teams: {
            team1: {
                players: {
                    player1: {
                        tossupStatline: [],
                        points: 0
                    }
                },
                tossupStatline: [],
                bonusStatline: [],
                points: 0
            }
        },
        packetName: '',
        packetNumbers: [],
        packetNumber: -1,
        questions: [{}],
        questionText: '',
        questionTextSplit: [],
        currentQuestionNumber: 0,
        currentlyBuzzing: false,
        paused: false,
    }
};

router.get('/', (req, res) => {
    res.sendFile('multiplayer.html', { root: './static' });
});

router.get('/*', (req, res) => {
    res.sendFile('room.html', { root: './static' });
})

module.exports = router;