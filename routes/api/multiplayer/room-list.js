import { tossupRooms } from '../../../server/multiplayer/handle-wss-connection.js';

import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  let activePlayers = 0;
  let activeRooms = 0;
  const roomList = [];

  for (const roomName in tossupRooms) {
    const onlineCount = Object.keys(tossupRooms[roomName].sockets).length;
    activePlayers += onlineCount;
    activeRooms += onlineCount > 0 ? 1 : 0;

    if (!tossupRooms[roomName].settings.public) { continue; }

    roomList.push({
      isPermanent: tossupRooms[roomName].isPermanent,
      onlineCount,
      playerCount: Object.keys(tossupRooms[roomName].players).length,
      roomName
    });
  }

  res.json({ activePlayers, activeRooms, roomList });
});

export default router;
