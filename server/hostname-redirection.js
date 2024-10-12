export default function hostnameRedirection (req, res, next) {
  const hostname = req.hostname;

  // Redirect to www.qbreader.org for specific hostnames
  if (['qbreader.herokuapp.com', 'qbreader-production.herokuapp.com', 'qbreader.org'].includes(hostname)) {
    return res.redirect(301, `https://www.qbreader.org${req.originalUrl}`);
  }

  // Redirect to test.qbreader.org for specific test hostnames
  if (['qbreader-test.herokuapp.com'].includes(hostname)) {
    return res.redirect(301, `https://test.qbreader.org${req.originalUrl}`);
  }

  next();
}
