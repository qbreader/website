import hasValidCharacters from '../moderation/has-valid-characters.js';
import isAppropriateString from '../moderation/is-appropriate-string.js';
import { createAndReturnRoom } from './TossupRoom.js';

import getRandomName from '../get-random-name.js';

import url from 'url';
import * as uuid from 'uuid';

/**
 * Handle WebSocket connection
 * @param {WebSocket} ws
 * @param {http.IncomingMessage} req
 */
export default function handleWssConnection (ws, req) {
  const parsedUrl = new url.URL(req.url, process.env.BASE_URL ?? 'http://localhost');
  const isPrivate = parsedUrl.searchParams.get('private') === 'true';
  const roomName = parsedUrl.searchParams.get('roomName');
  let userId = parsedUrl.searchParams.get('userId') ?? 'unknown';
  let username = parsedUrl.searchParams.get('username') ?? getRandomName();

  userId = (userId === 'unknown') ? uuid.v4() : userId;

  if (!hasValidCharacters(roomName)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'The room name contains an invalid character. Only A-Z, a-z, 0-9, - and _ are allowed.'
    }));
    return false;
  }

  if (!isAppropriateString(roomName)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'The room name contains an inappropriate word.'
    }));
    return false;
  }

  const room = createAndReturnRoom(roomName, isPrivate);
  if (room.settings.lock === true) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'The room is locked'
    }));
    return false;
  }

  if (!isAppropriateString(username)) {
    username = getRandomName();
    ws.send(JSON.stringify({
      type: 'force-username',
      username,
      message: 'Your username contains an inappropriate word, so it has been reset.'
    }));
  }

  room.connection(ws, userId, username);

  ws.on('error', (err) => {
    if (err instanceof RangeError) {
      console.log(`[WEBSOCKET] WARNING: Max payload exceeded from ip ${ws._socket.remoteAddress}`);
      ws.close();
    } else {
      console.log(err);
    }
  });
}
