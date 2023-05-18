const ipFilter = require('express-ipfilter').IpFilter;
const IpDeniedError = require('express-ipfilter').IpDeniedError;
const ips = [
    '3.236.192.58',
    '18.206.238.89',
    '18.215.118.139',
];


const clientIp = (req, _res) => {
    return req.headers['x-forwarded-for'] ? (req.headers['x-forwarded-for']).split(',')[0] : req.ip;
};

const ipFilterMiddleware = ipFilter(ips, { mode: 'deny', log: false, detectIp: clientIp });

const ipFilterError = (err, req, res, _next) => {
    if (err instanceof IpDeniedError) {
        console.log(`Blocked IP: ${req.ip}`);
        res.status(403);
        res.end();
    } else {
        res.status(err.status || 500);
    }
};

module.exports = {
    ipFilterMiddleware, ipFilterError
};
