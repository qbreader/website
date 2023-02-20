const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const uuid = require('uuid');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

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

const apiRouter = require('../routes/api');
const apiInfoRouter = require('../routes/api-info');
const tossupsRouter = require('../routes/tossups');
const bonusesRouter = require('../routes/bonuses');
const multiplayerRouter = require('../routes/multiplayer');
const databaseRouter = require('../routes/database');
const aboutRouter = require('../routes/about');

const rooms = {};

app.use(express.json());

app.get('/robots.txt', (req, res) => {
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

app.get('/api/multiplayer/room-list', (req, res) => {
    const roomList = {};
    for (const roomName in rooms) {
        if (rooms[roomName].settings.public) {
            roomList[roomName] = [Object.keys(rooms[roomName].players).length, Object.keys(rooms[roomName].sockets).length];
        }
    }

    res.send(JSON.stringify(roomList));
});

app.use('/api', apiRouter);
app.use('/tossups', tossupsRouter);
app.use('/bonuses', bonusesRouter);
app.use('/multiplayer', multiplayerRouter);
app.use('/db', databaseRouter);
app.use('/api-info', apiInfoRouter);
app.use('/about', aboutRouter);

app.get('/database', (req, res) => {
    res.redirect('/db');
});

app.get('/', (req, res) => {
    res.sendFile('tossups.html', { root: './client/singleplayer/' });
});


wss.on('connection', (ws) => {
    let [roomName, userId, username] = ws.protocol.split('%%%');
    roomName = DOMPurify.sanitize(decodeURIComponent(roomName));
    userId = decodeURIComponent(userId);
    username = decodeURIComponent(username);
    userId = (userId === 'unknown') ? uuid.v4() : userId;

    if (!Object.prototype.hasOwnProperty.call(rooms, roomName)) {
        rooms[roomName] = new Room(roomName);
    }

    rooms[roomName].connection(ws, userId, username);
});


app.use((req, res) => {
    res.sendFile(req.url, { root: './client' });
});


// listen on ipv4 instead of ipv6
server.listen({ port, host: '0.0.0.0' }, () => {
    console.log(`listening at port=${port}`);
});
