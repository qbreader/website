import 'dotenv/config';

import { ipFilterMiddleware, ipFilterError } from './ip-filter.js';
import { createAndReturnRoom } from './TossupRoom.js';

import { WEBSOCKET_MAX_PAYLOAD, COOKIE_MAX_AGE } from '../constants.js';
import indexRouter from '../routes/index.js';
import webhookRouter from '../routes/api/webhook.js';

import cookieSession from 'cookie-session';
import express from 'express';
import { createServer } from 'http';
import * as uuid from 'uuid';
import { WebSocketServer } from 'ws';
import url from 'url';

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3000;
const wss = new WebSocketServer({ server, maxPayload: WEBSOCKET_MAX_PAYLOAD });

// See https://masteringjs.io/tutorials/express/query-parameters
// for why we use 'simple'
app.set('query parser', 'simple');

app.use('/api/webhook', express.raw({ type: '*/*' }), webhookRouter);
app.use(express.json());

app.use(cookieSession({
    name: 'session',
    keys: [process.env.SECRET_KEY_1 ?? 'secretKey1', process.env.SECRET_KEY_2 ?? 'secretKey2'],
    maxAge: COOKIE_MAX_AGE,
}));

app.use(ipFilterMiddleware);
app.use(ipFilterError);

wss.on('connection', (ws, req) => {
    // Parse the URL of the incoming request
    const parsedUrl = url.parse(req.url, true);

    // Extract the 'isPrivate' query parameter
    const isPrivate = parsedUrl.query.private === 'true';
    let [roomName, userId, username] = ws.protocol.split('%%%');
    roomName = decodeURIComponent(roomName);
    userId = decodeURIComponent(userId);
    username = decodeURIComponent(username);
    userId = (userId === 'unknown') ? uuid.v4() : userId;

    const room = createAndReturnRoom(roomName, isPrivate);
    room.connection(ws, userId, username);

    ws.on('error', (err) => {
        if (err instanceof RangeError) {
            console.log(`[WEBSOCKET] WARNING: Max payload exceeded from ip ${ws._socket.remoteAddress}`);
            ws.close();
        } else {
            console.log(err);
        }
    });
});

app.use(indexRouter);

// listen on ipv4 instead of ipv6
server.listen({ port, host: '0.0.0.0' }, () => {
    console.log(`listening at port=${port}`);
});
