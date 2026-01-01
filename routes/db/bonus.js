import { escapeHTML } from '../../client/scripts/utilities/strings.js';
import getBonus from '../../database/qbreader/get-bonus.js';
import queryRedirect from '../../server/query-redirect.js';

import { Router } from 'express';
import fs from 'fs';
import { ObjectId } from 'mongodb';
const router = Router();

function removeParentheses (answer) {
  return answer.replace(/[([].*/g, '');
}

router.get('/', async (req, res) => {
  if (req.originalUrl.split('?')[0].at(-1) !== '/') { return queryRedirect('/db/bonus/')(req, res); }

  let _id = new URLSearchParams(req.query).get('_id');
  try { _id = new ObjectId(_id); } catch (e) { return res.status(400).send('Invalid ID'); }

  const bonus = await getBonus(_id);
  if (!bonus) { return res.sendStatus(404); }

  const description = `Bonus: ${bonus.answers_sanitized.map(a => escapeHTML(removeParentheses(a))).join(' / ')} [${bonus.set.name}]`;
  const file = fs.readFileSync('./client/db/bonus/index.html', { encoding: 'utf8' });
  res.send(file.replace('<meta name="description" content="">', `<meta name="description" content="${description}">`));
});

export default router;
