export default function httpsEnforcement (req, res, next) {
  const hostname = req.hostname;

  // Use HTTPS if not on localhost
  if (!req.secure && !['localhost', '127.0.0.1'].includes(hostname)) {
    return res.redirect(301, `https://${hostname}${req.originalUrl}`);
  }

  next();
}
