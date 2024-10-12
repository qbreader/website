import { tossupRooms } from '../../server/multiplayer/handle-wss-connection.js';

import { Router } from 'express';
const router = Router();

router.get('/room-list', (req, res) => {
  const roomList = [];
  for (const roomName in tossupRooms) {
    if (!tossupRooms[roomName].settings.public) {
      continue;
    }

    roomList.push({
      roomName,
      playerCount: Object.keys(tossupRooms[roomName].players).length,
      onlineCount: Object.keys(tossupRooms[roomName].sockets).length,
      isPermanent: tossupRooms[roomName].isPermanent
    });
  }

  res.json({ roomList });
});

export default router;
