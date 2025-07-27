/**
 * Creates a middleware function that redirects requests to a specified endpoint while preserving query parameters.
 * @param {string} endpoint - The target endpoint URL to redirect to
 * @returns {Function} Express middleware function that handles the redirect
 */
export default function queryRedirect (endpoint) {
  return (req, res) => {
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const newUrl = endpoint + queryString;
    res.redirect(newUrl);
  };
}
