import { Router } from 'express';

const router = Router();

const HEROKU_API = 'https://api.heroku.com';
const SOURCE_URL = process.env.DEPLOY_SOURCE_URL ?? 'https://github.com/qbreader/website/archive/refs/heads/main.tar.gz';

function herokuRequest (path, options = {}) {
  return fetch(`${HEROKU_API}/apps/${encodeURIComponent(process.env.HEROKU_APP_NAME)}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.heroku+json; version=3',
      Authorization: `Bearer ${process.env.HEROKU_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
}

router.use((req, res, next) => {
  if (!process.env.HEROKU_API_TOKEN || !process.env.HEROKU_APP_NAME) { return res.status(503).send('Deploying is not configured.'); }
  next();
});

// Starts a Heroku build of the latest main; Heroku releases it and restarts the dynos if the build succeeds
router.post('/', async (req, res) => {
  const response = await herokuRequest('/builds', {
    method: 'POST',
    body: JSON.stringify({ source_blob: { url: SOURCE_URL } })
  });

  if (!response.ok) { return res.status(502).send('Heroku rejected the deploy request.'); }

  res.json({ id: (await response.json()).id });
});

// Gets a build's status: pending, succeeded, or failed
router.get('/:id', async (req, res) => {
  const response = await herokuRequest(`/builds/${encodeURIComponent(req.params.id)}`);
  if (!response.ok) { return res.status(502).send('Could not get the build status.'); }

  const { status } = await response.json();
  res.json({ status });
});

export default router;
