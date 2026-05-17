import 'dotenv/config';

import indexRouter from './routes/index.js';
import webhookRouter from './routes/api/webhook.js';
import { ipFilterMiddleware } from './server/moderation/ip-filter.js';
import { COOKIE_MAX_AGE } from './server/constants.js';
import hostnameRedirection from './server/hostname-redirection.js';
import httpsEnforcement from './server/https-enforcement.js';

import cookieSession from 'cookie-session';
import express from 'express';
import morgan from 'morgan';

const app = express();
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// https://stackoverflow.com/questions/10348906/how-to-know-if-a-request-is-http-or-https-in-node-js
app.enable('trust proxy');
app.use(hostnameRedirection);
app.use(httpsEnforcement);

// See https://masteringjs.io/tutorials/express/query-parameters for why we use 'simple'
app.set('query parser', 'simple');

app.use('/api/webhook', express.raw({ type: '*/*' }), webhookRouter);
app.use(express.json());

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SECRET_KEY_1 ?? 'secretKey1', process.env.SECRET_KEY_2 ?? 'secretKey2'],
  maxAge: COOKIE_MAX_AGE
}));

app.use(ipFilterMiddleware);
app.use(indexRouter);

export default app;
