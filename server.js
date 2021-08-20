const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    // res.redirect('/static/tossups.html');
    res.sendFile(__dirname + '/static/tossups.html');
});

app.get('/getpacket', async (req, res) => {
    var directory = './packets/' + req.query.directory + '/' + req.query.packetNumber + '.json';
    var jsonfile = require(directory);
    res.send(JSON.stringify(jsonfile));
});

app.use(express.json());

app.use((req, res) => {
    res.sendFile(__dirname + req.url);
});

server.listen(port, () => {
    console.log('listening at http://localhost:${port}');
});