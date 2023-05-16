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

// See https://masteringjs.io/tutorials/express/query-parameters
// for why we use 'simple'
app.set('query parser', 'simple');

app.use(express.json());

const cookieSession = require('cookie-session');
app.use(cookieSession({
    name: 'session',
    keys: [process.env.SECRET_KEY_1 ?? 'secretKey1', process.env.SECRET_KEY_2 ?? 'secretKey2'],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const { ipFilterMiddleware, ipFilterError } = require('./ip-filter');
app.use(ipFilterMiddleware);
app.use(ipFilterError);


const TossupRoom = require('./TossupRoom');

const rooms = {};
const permanentRooms = ['hsquizbowl', 'collegequizbowl', 'literature', 'history', 'science', 'fine-arts'];

for (const roomName of permanentRooms) {
    rooms[roomName] = new TossupRoom(roomName, true);
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
        rooms[roomName] = new TossupRoom(roomName, false);

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


/**
 * Redirects:
 */
app.use('/users', (req, res) => {
    res.redirect(`/user${req.url}`);
});


app.get('/robots.txt', (_req, res) => {
    res.sendFile('robots.txt', { root: './client' });
});

app.get('/*.html', (req, res) => {
    res.redirect(req.url.substring(0, req.url.length - 5));
});

app.get('/react(-dom)?/umd/*.js', (req, res) => {
    res.sendFile(req.url, { root: './node_modules' });
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


app.use('/about', require('../routes/about'));
app.use('/api', require('../routes/api'));
app.use('/api-docs', require('../routes/api-docs'));
app.use('/auth', require('../routes/auth'));
app.use('/backups', require('../routes/backups'));
app.use('/bonuses', require('../routes/bonuses'));
app.use('/db', require('../routes/database'));
app.use('/multiplayer', require('../routes/multiplayer'));
app.use('/tossups', require('../routes/tossups'));
app.use('/user', require('../routes/user'));
app.use('/', require('../routes/index'));


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
