const ips = [
  '3.236.192.58',
  '18.206.238.89',
  '18.215.118.139',
  '73.51.224.137'
];

export const clientIp = (req, _res) => {
  return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.ip;
};

export const ipFilterMiddleware = (req, res, next) => {
  const ip = clientIp(req);
  if (ips.includes(ip)) {
    console.log(`Blocked IP: ${req.ip}`);
    return res.status(403).end();
  }
  next();
};
