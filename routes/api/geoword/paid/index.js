import getUserId from '../../../../database/account-info/get-user-id.js';
import checkPayment from '../../../../database/geoword/check-payment.js';
import { checkToken } from '../../../../server/authentication.js';

import playRouter from './play/index.js';
import resultsRouter from './results/index.js';

import { Router } from 'express';

const router = Router();

/**
 * All routes in this folder require payment or authentication.
 * It expects a packetName query parameter to be passed.
 */
router.use(async (req, res, next) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
  }

  const packetName = req.query.packetName;
  const userId = await getUserId(username);
  const paid = await checkPayment(packetName, userId);
  if (!paid) {
    res.status(403).send('Payment required');
    return;
  }

  next();
});

router.use('/play', playRouter);
router.use('/results', resultsRouter);

export default router;
