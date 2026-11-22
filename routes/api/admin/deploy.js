import { Router } from 'express';

const router = Router();

const HEROKU_API = 'https://api.heroku.com';
const SOURCE_URL = 'https://github.com/qbreader/website/archive/refs/heads/main.tar.gz';

// Starts a Heroku build of the latest main; Heroku releases it and restarts the dynos if the build succeeds
router.post('/', async (req, res) => {
  if (!process.env.HEROKU_API_TOKEN || !process.env.HEROKU_APP_NAME) { return res.status(503).send('Deploying is not configured.'); }

  const response = await fetch(`${HEROKU_API}/apps/${encodeURIComponent(process.env.HEROKU_APP_NAME)}/builds`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.heroku+json; version=3',
      Authorization: `Bearer ${process.env.HEROKU_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ source_blob: { url: SOURCE_URL } })
  });

  if (!response.ok) { return res.status(502).send('Heroku rejected the deploy request.'); }
  res.sendStatus(202);
});

export default router;
