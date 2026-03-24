import fs from 'fs';
import path from 'path';

const head = fs.readFileSync('./client/head.html', 'utf8');
const nav = fs.readFileSync('./client/nav/index.html', 'utf8');

export default function (req, res, next) {
  if (path.extname(req.path) !== '') { return next(); }

  const filePath = path.resolve('./client' + req.path + (req.path.slice(-1) === '/' ? 'index.html' : '.html'));
  // prevent directory traversal attack
  if (!filePath.startsWith(path.resolve('./client'))) { return next(); }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return next();
    data = data.replace('<!--#include virtual="/head.html" -->', head);
    data = data.replace('<!--#include virtual="/nav/index.html" -->', nav);
    res.send(data);
  });
}
