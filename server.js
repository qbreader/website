const express = require('express');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

const fs = require('fs');

app.use(express.static('static'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/tossups.html');
});

app.get('/get-packet', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.set_name = decodeURI(req.query.set_name.toLowerCase());
    req.query.set_name = req.query.set_name.replace(/\s/g, '_');
    var directory = `./packets/${req.query.year}-${req.query.set_name}/${req.query.packet_number}.json`;
    try {
        var jsonfile = require(directory);
        res.send(JSON.stringify(jsonfile));
    } catch (error) {
        console.log('ERROR: Could not find packet located at ' + directory);
        res.send(JSON.stringify({}));
    }
});

app.get('/get-num-packets', async (req, res) => {
    req.query.year = decodeURI(req.query.year);
    req.query.set_name = decodeURI(req.query.set_name.toLowerCase());
    req.query.set_name = req.query.set_name.replace(/\s/g, '_');
    var directory = `./packets/${req.query.year}-${req.query.set_name}`;
    var numPackets = 0;
    try {
        fs.readdirSync(directory).forEach(file => {
            if (file.endsWith('.json')) {
                numPackets++;
            }
        });
        res.send(JSON.stringify({num_packets: numPackets.toString()}));
    } catch (error) {
        console.log('ERROR: Could not find directory ' + directory);
    }
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