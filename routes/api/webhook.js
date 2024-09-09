import recordPayment from '../../database/geoword/record-payment.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';
import StripeClass from 'stripe';

const router = Router();
const stripe = new StripeClass(process.env.STRIPE_SECRET_KEY);

// This is your test secret API key.
// Replace this endpoint secret with your endpoint's unique secret
// If you are testing with the CLI, find the secret by running 'stripe listen'
// If you are using an endpoint defined with the API or dashboard, look in your webhook settings
// at https://dashboard.stripe.com/webhooks
const endpointSecret = process.env.STRIPE_SIGNING_SECRET;

router.post('/', (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntentSucceeded = event.data.object;
      // Then define and call a function to handle the event payment_intent.succeeded
      let { user_id: userId, packetName } = paymentIntentSucceeded.metadata;
      try { userId = new ObjectId(userId); } catch (e) { return res.status(400).send('Invalid user ID'); }
      recordPayment(packetName, userId);
      break;
    }

    case 'charge.succeeded':
      // We can safely ignore this
      res.send();
      return;

    default:
        // ... handle other event types
        // console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  console.log('Received event:', event.type);
  res.send();
});

export default router;
