const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/getpacket', async (req, res) => {
  let directory = req.query.directory;
  let packetnumber = req.query.packetnumber;
  directory = './packets/' + directory + '/' + packetnumber + '.json';
  var jsonfile = require(directory);
  res.send(JSON.stringify(jsonfile));
});

app.use((req, res) => {
	res.sendFile(__dirname + req.url);
});

server.listen(port, () => {
  console.log('listening at http://localhost:${port}');
});