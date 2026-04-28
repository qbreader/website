export const clientIp = (req, _res) => {
  return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.ip;
};

export function isBannedIp (ip) {
  return false;
}

export const ipFilterMiddleware = (req, res, next) => {
  next();
};
