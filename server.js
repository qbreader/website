const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.port || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use((req, res) => {
	res.sendFile(__dirname + req.url);
});

server.listen(port, () => {
  console.log('listening at http://localhost:${port}');
});