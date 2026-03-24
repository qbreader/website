import fs from 'fs';

import { Router } from 'express';
const router = Router();

const head = fs.readFileSync('./client/head.html', 'utf8');
const nav = fs.readFileSync('./client/nav/index.html', 'utf8');
const room = fs.readFileSync('./client/play/mp/room.html', 'utf8')
  .replace('<!--#include virtual="/nav/index.html" -->', nav)
  .replace('<!--#include virtual="/head.html" -->', head);

// only match paths that don't have a file extension
router.get(/^\/[^.]+$/, (_req, res) => {
  res.send(room);
});

export default router;
