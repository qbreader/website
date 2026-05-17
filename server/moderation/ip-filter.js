import { accountInfo } from '../../database/databases.js';
const ipBans = accountInfo.collection('ip-bans');

async function getBannedIps () {
  try {
    return await ipBans.find().toArray().then(results => results.map(result => result.ipv4));
  } catch (error) {
    return [];
  }
}

const ips = await getBannedIps();

export const clientIp = (req, _res) => {
  return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.ip;
};

export function isBannedIp (ip) {
  return ips.includes(ip);
}

export const ipFilterMiddleware = (req, res, next) => {
  const ip = clientIp(req);
  if (isBannedIp(ip)) {
    const message = 'Your IP address has been blocked. If you believe this is an error, contact a developer.';
    return res.status(403).send(message).end();
  }
  next();
};
