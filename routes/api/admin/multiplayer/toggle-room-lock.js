import { tossupBonusRooms } from '../../../../server/multiplayer/handle-wss-connection.js';

import { Router } from 'express';
const router = Router();

router.post('/', (req, res) => {
  const { roomName, lock } = req.body;

  if (typeof lock !== 'boolean') {
    return res.status(400).send('Invalid lock value');
  }

  if (!roomName || typeof roomName !== 'string' || !Object.prototype.hasOwnProperty.call(tossupBonusRooms, roomName)) {
    return res.status(400).send('Invalid room name');
  }

  tossupBonusRooms[roomName].settings.lock = lock;
  if (lock) { tossupBonusRooms[roomName].removeAllPlayers(); }
  res.send(`Room ${roomName} lock status set to ${lock}`);
});

export default router;
