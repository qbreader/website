const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });
const uuid = require('uuid');

const rooms = require('./rooms');

const apiRouter = require('./routes/api');
const apiInfoRouter = require('./routes/api-info');
const tossupsRouter = require('./routes/tossups');
const bonusesRouter = require('./routes/bonuses');
const multiplayerRouter = require('./routes/multiplayer');
const aboutRouter = require('./routes/about');

app.use(express.json());

app.get('/*.html', (req, res) => {
    res.redirect(req.url.substring(0, req.url.length - 5));
});

app.get('/*.js', (req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

app.get('/*.css', (req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

app.get('/*.map', (req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

app.get('/*.ico', (req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

app.use('/api', apiRouter);
app.use('/tossups', tossupsRouter);
app.use('/bonuses', bonusesRouter);
app.use('/multiplayer', multiplayerRouter);
app.use('/api-info', apiInfoRouter);
app.use('/about', aboutRouter);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/singleplayer/tossups/tossups.html');
});

var sockets = {};

wss.on('connection', (ws) => {
    console.log(`Connection in room ${ws.protocol}`);
    ws.userId = uuid.v4();
    if (ws.protocol in sockets) {
        sockets[ws.protocol].push(ws);
    } else {
        rooms.createRoom(ws.protocol);
        sockets[ws.protocol] = [ws];
    }

    ws.send(JSON.stringify({
        type: 'user-id',
        userId: ws.userId
    }));

    ws.on('message', async (message) => {
        message = JSON.parse(message);
        message.userId = ws.userId;
        message = await rooms.parseMessage(ws.protocol, message);
        console.log(message);

        if (message.type === 'join' || message.type === 'change-username') {
            ws.username = message.username;
        }

        for (let i = 0; i < sockets[ws.protocol].length; i++) {
            sockets[ws.protocol][i].send(JSON.stringify(message));
        }
    });

    ws.on('close', () => {
        console.log(`User ${ws.username} closed connection in room ${ws.protocol}`);
        let message = { type: 'leave', userId: ws.userId, username: ws.username };
        rooms.parseMessage(ws.protocol, message);

        for (let i = 0; i < sockets[ws.protocol].length; i++) {
            if (sockets[ws.protocol][i] === ws) continue;

            sockets[ws.protocol][i].send(JSON.stringify(message));
        }

        sockets[ws.protocol] = sockets[ws.protocol].filter(socket => socket !== ws);

        // Delete stale rooms
        if (sockets[ws.protocol].length === 0) {
            console.log(`Deleted room ${ws.protocol}`);
            rooms.deleteRoom(ws.protocol);
            delete sockets[ws.protocol];
        }
    });
});


app.use((req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

server.listen(port, () => {
    console.log(`listening at port=${port}`);
});