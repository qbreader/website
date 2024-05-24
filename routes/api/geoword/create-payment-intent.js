import getUserId from '../../../database/account-info/get-user-id.js';
import getCost from '../../../database/geoword/get-cost.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';
import StripeClass from 'stripe';

const router = Router();
const stripe = new StripeClass(process.env.STRIPE_SECRET_KEY);

router.post('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  const userId = await getUserId(username);
  const packetName = req.body.packetName;
  const cost = await getCost(packetName);

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: cost, // default $2.50
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true
    },
    metadata: { user_id: String(userId), packetName }
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

export default router;
