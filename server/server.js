import 'dotenv/config';

import { ipFilterMiddleware, ipFilterError } from './ip-filter.js';
import { createAndReturnRoom } from './TossupRoom.js';

import { WEBSOCKET_MAX_PAYLOAD, COOKIE_MAX_AGE } from '../constants.js';

import aboutRouter from '../routes/about.js';
import adminRouter from '../routes/admin/index.js';
import apiRouter from '../routes/api/index.js';
import apiDocsRouter from '../routes/api-docs.js';
import authRouter from '../routes/auth/index.js';
import backupsRouter from '../routes/backups.js';
import bonusesRouter from '../routes/bonuses.js';
import databaseRouter from '../routes/database.js';
import geowordRouter from '../routes/geoword/index.js';
import indexRouter from '../routes/index.js';
import multiplayerRouter from '../routes/multiplayer.js';
import tossupsRouter from '../routes/tossups.js';
import userRouter from '../routes/user.js';
import webhookRouter from '../routes/api/webhook.js';

import cookieSession from 'cookie-session';
import express from 'express';
import { createServer } from 'http';
import * as uuid from 'uuid';
import { WebSocketServer } from 'ws';

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

wss.on('connection', (ws) => {
    let [roomName, userId, username] = ws.protocol.split('%%%');
    roomName = decodeURIComponent(roomName);
    userId = decodeURIComponent(userId);
    username = decodeURIComponent(username);
    userId = (userId === 'unknown') ? uuid.v4() : userId;

    const room = createAndReturnRoom(roomName);
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

app.use('/', indexRouter);
app.use('/about', aboutRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);
app.use('/api-docs', apiDocsRouter);
app.use('/auth', authRouter);
app.use('/backups', backupsRouter);
app.use('/bonuses', bonusesRouter);
app.use('/db', databaseRouter);
app.use('/geoword', geowordRouter);
app.use('/multiplayer', multiplayerRouter);
app.use('/tossups', tossupsRouter);
app.use('/user', userRouter);
app.use('/webhook', webhookRouter);


app.use((req, res) => {
    res.sendFile(req.url, { root: './client' });
});

// listen on ipv4 instead of ipv6
server.listen({ port, host: '0.0.0.0' }, () => {
    console.log(`listening at port=${port}`);
});
