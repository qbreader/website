import 'dotenv/config';

import app from './app.js';
import handleWssConnection from './server/multiplayer/handle-wss-connection.js';

import { createServer } from 'http';
import { WebSocketServer } from 'ws';

if (process.env.NODE_ENV === 'production') {
  for (const key of ['SECRET', 'SALT', 'SECRET_KEY_1', 'SECRET_KEY_2']) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable in production: ${key}`);
    }
  }
}

export const WEBSOCKET_MAX_PAYLOAD = 1024 * 10 * 1; // 10 KB

const server = createServer(app);
const port = process.env.PORT || 3000;
const wss = new WebSocketServer({ server, maxPayload: WEBSOCKET_MAX_PAYLOAD, handshakeTimeout: 30000 });
wss.on('connection', handleWssConnection);

// listen on ipv4 instead of ipv6
server.listen({ port, host: '0.0.0.0' }, () => { console.log(`listening at port=${port}`); });
