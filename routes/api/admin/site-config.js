import getSiteConfig from '../../../database/qbreader/get-site-config.js';
import updateSiteConfig from '../../../database/qbreader/admin/update-site-config.js';
import { MAX_MARKDOWN_LENGTH, SITE_CONFIG_NAMES } from '../../../server/site-config.js';

import { Router } from 'express';

const router = Router();

router.get('/:name', async (req, res) => {
  const { name } = req.params;
  if (!SITE_CONFIG_NAMES.includes(name)) { return res.status(404).send('Unknown config'); }

  const { markdown } = await getSiteConfig(name);
  res.json({ markdown });
});

router.put('/:name', async (req, res) => {
  const { name } = req.params;
  if (!SITE_CONFIG_NAMES.includes(name)) { return res.status(404).send('Unknown config'); }

  const { markdown } = req.body;
  if (typeof markdown !== 'string') { return res.status(400).send('Invalid markdown'); }
  if (markdown.length > MAX_MARKDOWN_LENGTH) { return res.status(400).send(`Markdown must be at most ${MAX_MARKDOWN_LENGTH} characters`); }

  await updateSiteConfig(name, markdown.trim());
  res.sendStatus(200);
});

export default router;
