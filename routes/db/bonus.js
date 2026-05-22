import { replaceSSI } from '../ssi-middleware.js';
import * as validateObjectId from '../validators/object-id.js';
import { escapeHTML } from '../../client/scripts/utilities/strings.js';
import getBonus from '../../database/qbreader/get-bonus.js';
import queryRedirect from '../../server/query-redirect.js';

import { Router } from 'express';
import fs from 'fs';
const router = Router();

function removeParentheses (answer) {
  return answer.replace(/[([].*/g, '');
}

const file = replaceSSI(fs.readFileSync('./client/db/bonus/index.html', 'utf8'));

router.get('/', async (req, res) => {
  if (req.originalUrl.split('?')[0].at(-1) !== '/') { return queryRedirect('/db/bonus/')(req, res); }

  req.query = validateObjectId._id(req.query);
  if (!req.query._id) { return res.status(400).send('Invalid Bonus ID'); }
  const bonus = await getBonus(req.query);
  if (!bonus) { return res.sendStatus(404); }

  const description = `Bonus: ${bonus.answers_sanitized.map(a => escapeHTML(removeParentheses(a))).join(' / ')} [${bonus.set.name}]`;
  res.send(file.replace('<meta name="description" content="">', `<meta name="description" content="${description}">`));
});

export default router;
