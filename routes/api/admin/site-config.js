import getSiteConfig from '../../../database/qbreader/get-site-config.js';
import updateSiteConfig from '../../../database/qbreader/admin/update-site-config.js';
import { MAX_MARKDOWN_LENGTH, SITE_CONFIG_IDS } from '../../../server/site-config.js';

import { Router } from 'express';

const router = Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!SITE_CONFIG_IDS.includes(id)) { return res.status(404).send('Unknown config'); }

  const { markdown } = await getSiteConfig(id);
  res.json({ markdown });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  if (!SITE_CONFIG_IDS.includes(id)) { return res.status(404).send('Unknown config'); }

  const { markdown } = req.body;
  if (typeof markdown !== 'string') { return res.status(400).send('Invalid markdown'); }
  if (markdown.length > MAX_MARKDOWN_LENGTH) { return res.status(400).send(`Markdown must be at most ${MAX_MARKDOWN_LENGTH} characters`); }

  await updateSiteConfig(id, markdown.trim());
  res.sendStatus(200);
});

export default router;
