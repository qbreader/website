import expressIpfilter from 'express-ipfilter';
const { IpFilter, IpDeniedError } = expressIpfilter;

const ips = [
  '3.236.192.58',
  '18.206.238.89',
  '18.215.118.139',
  '73.51.224.137'
];

export const clientIp = (req, _res) => {
  return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.ip;
};

export const ipFilterMiddleware = IpFilter(ips, { mode: 'deny', log: false, detectIp: clientIp });

export const ipFilterError = (err, req, res, _next) => {
  if (err instanceof IpDeniedError) {
    console.log(`Blocked IP: ${req.ip}`);
    res.status(403);
    res.end();
  } else {
    res.status(err.status || 500);
  }
};
