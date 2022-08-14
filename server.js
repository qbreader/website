const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const uuid = require('uuid');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

const Room = require('./Room');

const apiRouter = require('./routes/api');
const apiInfoRouter = require('./routes/api-info');
const tossupsRouter = require('./routes/tossups');
const bonusesRouter = require('./routes/bonuses');
const multiplayerRouter = require('./routes/multiplayer');
const aboutRouter = require('./routes/about');

const rooms = {};

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

app.get('/api/multiplayer/room-list', (req, res) => {
    let roomList = {};
    for (const roomName in rooms) {
        if (rooms[roomName].public) {
            roomList[roomName] = [Object.keys(rooms[roomName].players).length, Object.keys(rooms[roomName].sockets).length];
        }
    }

    res.send(JSON.stringify(roomList));
});

app.use('/api', apiRouter);
app.use('/tossups', tossupsRouter);
app.use('/bonuses', bonusesRouter);
app.use('/multiplayer', multiplayerRouter);
app.use('/api-info', apiInfoRouter);
app.use('/about', aboutRouter);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/singleplayer/tossups.html');
});


wss.on('connection', (ws) => {
    let [roomName, userId, username] = ws.protocol.split('%%%');
    userId = decodeURIComponent(userId);
    username = decodeURIComponent(username);
    userId = (userId === 'unknown') ? uuid.v4() : userId;

    if (!rooms.hasOwnProperty(roomName)) {
        rooms[roomName] = new Room(roomName);
    }

    rooms[roomName].connection(ws, userId, username);
});


app.use((req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

server.listen(port, () => {
    console.log(`listening at port=${port}`);
});