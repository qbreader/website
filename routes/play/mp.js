import fs from 'fs';

import { Router } from 'express';
const router = Router();

const nav = fs.readFileSync('./client/nav/index.html', 'utf8');
const room = fs.readFileSync('./client/play/mp/room.html', 'utf8');
const roomWithNav = room.replace('<!--#include virtual="/nav/index.html" -->', nav);

// only match paths that don't have a file extension
router.get(/^\/[^.]+$/, (_req, res) => {
  res.send(roomWithNav);
});

export default router;
