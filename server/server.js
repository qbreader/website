if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const uuid = require('uuid');
const WebSocket = require('ws');
const wss = new WebSocket.Server({
    server,
    maxPayload: 1024 * 1024 * 1, // 1 MB
});

app.use(express.json());

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);


const clientIp = (req, _res) => {
    return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.ip;
};

const ipFilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;
const ips = require('../BLOCKED_IPS');
console.log(`Blocked IPs: ${ips}`);
app.use(ipFilter(ips, { mode: 'deny', log: false, detectIp: clientIp }));

app.use((err, req, res, _next) => {
    if (err instanceof IpDeniedError) {
        console.log(`Blocked IP: ${req.ip}`);
        res.status(403);
        res.end();
    } else {
        res.status(err.status || 500);
    }
});


const Room = require('./Room');

const rooms = {};
const permanentRooms = ['hsquizbowl', 'collegequizbowl', 'literature', 'history', 'science', 'fine-arts'];

for (const roomName of permanentRooms) {
    rooms[roomName] = new Room(roomName, true);
}

app.get('/api/multiplayer/room-list', (_req, res) => {
    const roomList = {};
    for (const roomName in rooms) {
        if (rooms[roomName].settings.public) {
            roomList[roomName] = [
                Object.keys(rooms[roomName].players).length,
                Object.keys(rooms[roomName].sockets).length,
                permanentRooms.includes(roomName),
            ];
        }
    }

    res.send(JSON.stringify(roomList));
});

wss.on('connection', (ws) => {
    let [roomName, userId, username] = ws.protocol.split('%%%');
    roomName = DOMPurify.sanitize(decodeURIComponent(roomName));
    userId = decodeURIComponent(userId);
    username = decodeURIComponent(username);
    userId = (userId === 'unknown') ? uuid.v4() : userId;

    if (!Object.prototype.hasOwnProperty.call(rooms, roomName))
        rooms[roomName] = new Room(roomName, false);

    rooms[roomName].connection(ws, userId, username);

    ws.on('error', (err) => {
        if (err instanceof RangeError) {
            console.log(`[WEBSOCKET] WARNING: Max payload exceeded from ip ${ws._socket.remoteAddress}`);
            ws.close();
        } else {
            console.log(err);
        }
    });
});


app.get('/robots.txt', (_req, res) => {
    res.sendFile('robots.txt', { root: './client' });
});

app.get('/*.html', (req, res) => {
    res.redirect(req.url.substring(0, req.url.length - 5));
});

app.get('/*.js', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

app.get('/*.jsx', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

app.get('/*.css', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

app.get('/*.map', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

app.get('/*.png', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});

app.get('/*.ico', (req, res) => {
    res.sendFile(req.url, { root: './client' });
});


const apiRouter = require('../routes/api');
const apiInfoRouter = require('../routes/api-info');
const tossupsRouter = require('../routes/tossups');
const bonusesRouter = require('../routes/bonuses');
const multiplayerRouter = require('../routes/multiplayer');
const databaseRouter = require('../routes/database');
const aboutRouter = require('../routes/about');
const backupsRouter = require('../routes/backups');
const indexRouter = require('../routes/index');


app.use('/api', apiRouter);
app.use('/tossups', tossupsRouter);
app.use('/bonuses', bonusesRouter);
app.use('/multiplayer', multiplayerRouter);
app.use('/db', databaseRouter);
app.use('/api-info', apiInfoRouter);
app.use('/about', aboutRouter);
app.use('/backups', backupsRouter);
app.use('/', indexRouter);


app.get('/database', (_req, res) => {
    res.redirect('/db');
});

app.use((req, res) => {
    res.sendFile(req.url, { root: './client' });
});


// listen on ipv4 instead of ipv6
server.listen({ port, host: '0.0.0.0' }, () => {
    console.log(`listening at port=${port}`);
});
