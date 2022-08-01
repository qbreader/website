const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

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
    res.sendFile(__dirname + '/client/singleplayer/tossups.html');
});


wss.on('connection', (ws) => {
    console.log(`Connection in room ${ws.protocol}`);

    rooms.createRoom(ws.protocol);
    rooms.createPlayer(ws.protocol, ws);
});


app.use((req, res) => {
    res.sendFile(__dirname + '/client/' + req.url);
});

server.listen(port, () => {
    console.log(`listening at port=${port}`);
});