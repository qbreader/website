import crypto from 'crypto';
import { Router } from 'express';

const router = Router();

// Set this from your MailerSend webhook's "Signing secret" (per-webhook, not your API token)
const SIGNING_SECRET = process.env.MAILERSEND_WEBHOOK_SECRET;

// MailerSend's publicly documented fixed secret used ONLY for the webhook.test ping
const MAILERSEND_TEST_SECRET = 'test_Am3L1GuOIc4blLUuHqAPxxwkZaJyEk8G';

// Straight from MailerSend's docs: https://developers.mailersend.com/api/v1/account/webhooks#security
function verifySignature (requestContent, receivedSignature, signingSecret) {
  if (!receivedSignature || !signingSecret) return false;

  const computedSignature = crypto
    .createHmac('sha256', signingSecret)
    .update(requestContent, 'utf8')
    .digest('hex');

  // timingSafeEqual throws on a length mismatch (e.g. a malformed/truncated
  // header), so guard that first rather than letting it throw
  const received = Buffer.from(receivedSignature, 'hex');
  const computed = Buffer.from(computedSignature, 'hex');
  return received.length === computed.length && crypto.timingSafeEqual(received, computed);
}

const recipientStatus = new Map();

router.post('/', (req, res) => {
  const rawBody = req.body; // Buffer, thanks to express.raw()
  const signature = req.header('Signature');

  const isTestPing = (() => {
    try {
      return JSON.parse(rawBody.toString('utf8')).type === 'webhook.test';
    } catch {
      return false;
    }
  })();

  const secretToUse = isTestPing ? MAILERSEND_TEST_SECRET : SIGNING_SECRET;

  if (!verifySignature(rawBody, signature, secretToUse)) {
    // Wrong signature -- not actually from MailerSend (or misconfigured secret)
    return res.status(401).send('invalid signature');
  }

  // Signature is valid -- now safe to parse and act on the body
  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).send('invalid json');
  }

  if (event.type === 'webhook.test') {
    // Just needs a 2xx so MailerSend saves the webhook
    return res.sendStatus(200);
  }

  // Per MailerSend's documented payloads, the recipient is a plain email
  // string at event.data.recipient (not a nested object)
  const email = event?.data?.recipient;

  recipientStatus.set(email, event.type);

  // Must respond within MailerSend's ~3 second deadline
  return res.sendStatus(200);
}
);

export default router;
