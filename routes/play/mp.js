import { replaceSSI } from '../ssi-middleware.js';

import { Router } from 'express';
import fs from 'fs';

const router = Router();

const room = replaceSSI(fs.readFileSync('./client/play/mp/room.html', 'utf8'));

// only match paths that don't have a file extension
router.get(/^\/[^.]+$/, (_req, res) => {
  res.send(room);
});

export default router;
