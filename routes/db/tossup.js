import * as validateObjectId from '../validators/object-id.js';
import { escapeHTML } from '../../client/scripts/utilities/strings.js';
import getTossup from '../../database/qbreader/get-tossup.js';
import queryRedirect from '../../server/query-redirect.js';

import { Router } from 'express';
import fs from 'fs';
const router = Router();

const head = fs.readFileSync('./client/head.html', 'utf8');
const nav = fs.readFileSync('./client/nav/index.html', 'utf8');
const file = fs.readFileSync('./client/db/tossup/index.html', 'utf8')
  .replace('<!--#include virtual="/head.html" -->', head)
  .replace('<!--#include virtual="/nav/index.html" -->', nav);

function removeParentheses (answer) {
  return answer.replace(/[([].*/g, '');
}

router.get('/', async (req, res) => {
  if (req.originalUrl.split('?')[0].at(-1) !== '/') { return queryRedirect('/db/tossup/')(req, res); }

  req.query = validateObjectId._id(req.query);
  if (!req.query._id) { return res.status(400).send('Invalid Tossup ID'); }
  const tossup = await getTossup(req.query);
  if (!tossup) { return res.sendStatus(404); }

  const description = `Tossup: ${escapeHTML(removeParentheses(tossup.answer_sanitized))} [${tossup.set.name}]`;
  res.send(file.replace('<meta name="description" content="">', `<meta name="description" content="${description}">`));
});

export default router;
