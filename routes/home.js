import getSiteConfig from '../database/qbreader/get-site-config.js';
import renderMarkdown from '../server/render-markdown.js';
import { replaceSSI } from './ssi-middleware.js';

import { Router } from 'express';
import fs from 'fs';

const router = Router();

const CACHE_MILLISECONDS = 60 * 1000;
const template = replaceSSI(fs.readFileSync('./client/index.html', 'utf8'));

let cachedPage = null;
let cachedAt = 0;

async function getPage () {
  if (cachedPage !== null && Date.now() - cachedAt < CACHE_MILLISECONDS) { return cachedPage; }

  const { markdown } = await getSiteConfig('feature-of-the-day');
  cachedPage = template.replace('<!--#feature-of-the-day-->', () => renderMarkdown(markdown));
  cachedAt = Date.now();
  return cachedPage;
}

router.get('/', async (_req, res, next) => {
  try {
    res.send(await getPage());
  } catch (error) {
    next(error);
  }
});

export default router;
