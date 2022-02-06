const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

app.use(express.static('static'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/tossups.html');
});

app.get('/getpacket', async (req, res) => {
    var directory = './packets/' + req.query.directory + '/' + req.query.packetNumber + '.json';
    var jsonfile = require(directory);
    res.send(JSON.stringify(jsonfile));
});

app.use((req, res) => {
    // secure the backend code so it can't be accessed by the frontend
    if (req.url === '/server.js') {
        res.redirect('/');
    } else {
        res.sendFile(__dirname + req.url);
    }
});

server.listen(port, () => {
    console.log(`listening at port=${port}`);
});