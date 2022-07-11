const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

const rooms = require('./rooms').default;

const apiRouter = require('./routes/api');
const tossupsRouter = require('./routes/tossups');
const bonusesRouter = require('./routes/bonuses');
const multiplayerRouter = require('./routes/multiplayer');
const aboutRouter = require('./routes/about');

app.use(express.json());

app.use('/api', apiRouter);
app.use('/tossups', tossupsRouter);
app.use('/bonuses', bonusesRouter);
app.use('/multiplayer', multiplayerRouter);
app.use('/about', aboutRouter);

app.get('/*.html', (req, res) => {
    res.redirect(req.url.substring(0, req.url.length - 5));
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/tossups.html');
});

sockets = {};

wss.on('connection', (ws) => {
    console.log(`Connection in room ${ws.protocol}`);
    if (ws.protocol in sockets) {
        sockets[ws.protocol].push(ws);
    } else {
        sockets[ws.protocol] = [ws];
    }

    ws.on('message', (message) => {
        console.log(JSON.parse(message));
        rooms.parseMessage(ws.protocol, JSON.parse(message));
        for (let i = 0; i < sockets[ws.protocol].length; i++) {
            if (sockets[ws.protocol][i] === ws) continue;

            sockets[ws.protocol][i].send(JSON.stringify(JSON.parse(message)));
        }
    });
});


app.use((req, res) => {
    // secure the backend code so it can't be accessed by the frontend
    if (req.url === '/server.js') {
        res.redirect('/');
    } else {
        res.sendFile(__dirname + '/static/' + req.url);
    }
});

server.listen(port, () => {
    console.log(`listening at port=${port}`);
});