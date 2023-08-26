import { tossupRooms } from '../../server/TossupRoom.js';

import { Router } from 'express';
const router = Router();


router.get('/room-list', (req, res) => {
    const roomList = [];
    for (const roomName in tossupRooms) {
        if (!tossupRooms[roomName].settings.public) {
            continue;
        }

        roomList.push({
            roomName: roomName,
            playerCount: Object.keys(tossupRooms[roomName].players).length,
            onlineCount: Object.keys(tossupRooms[roomName].sockets).length,
            isPermanent: tossupRooms[roomName].isPermanent,
        });
    }

    res.header('Access-Control-Allow-Origin', '*');
    res.json({ roomList });
});


export default router;
