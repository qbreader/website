import fs from 'fs';
import path from 'path';

const ssiFileNames = [
  'funny-toast.html',
  'head.html',
  'nav.html',
  'report-question-modal.html',
  'star-toast.html'
];

const ssiFiles = ssiFileNames.map(fileName => fs.readFileSync(`./client/ssi/${fileName}`, 'utf8'));

export function replaceSSI (html) {
  for (let i = 0; i < ssiFileNames.length; i++) {
    html = html.replace(`<!--#include virtual="/ssi/${ssiFileNames[i]}" -->`, ssiFiles[i]);
  }
  return html;
}

export default function (req, res, next) {
  if (path.extname(req.path) !== '') { return next(); }

  const filePath = path.resolve('./client' + req.path + (req.path.slice(-1) === '/' ? 'index.html' : '.html'));
  // prevent directory traversal attack
  if (!filePath.startsWith(path.resolve('./client'))) { return next(); }
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return next();
    data = replaceSSI(data);
    res.send(data);
  });
}
