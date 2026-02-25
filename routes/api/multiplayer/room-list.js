import { tossupBonusRooms } from '../../../server/multiplayer/handle-wss-connection.js';

import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  let activePlayers = 0;
  let activeRooms = 0;
  const roomList = [];

  for (const roomName in tossupBonusRooms) {
    const onlineCount = Object.keys(tossupBonusRooms[roomName].sockets).length;
    activePlayers += onlineCount;
    activeRooms += onlineCount > 0 ? 1 : 0;

    if (!tossupBonusRooms[roomName].settings.public) { continue; }

    roomList.push({
      isPermanent: tossupBonusRooms[roomName].isPermanent,
      isVerified: tossupBonusRooms[roomName].isVerified ?? false,
      onlineCount,
      playerCount: Object.keys(tossupBonusRooms[roomName].players).length,
      roomName
    });
  }

  res.json({ activePlayers, activeRooms, roomList });
});

export default router;
