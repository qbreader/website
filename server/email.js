/**
 * This file is used to actually send emails.
 * Any other functions relating to emails, such as active password reset tokens, are in server/authentication.js.
 *
 * This file uses nodemailer's direct transport, which sends emails directly to
 * recipient mail servers via DNS MX lookups (no relay/SMTP provider needed).
 *
 * Required DNS settings for qbreader.org:
 *
 * 1. SPF record — authorises the server's IP to send mail for the domain.
 *    Type : TXT
 *    Name : @ (i.e. qbreader.org)
 *    Value: v=spf1 ip4:<YOUR_SERVER_IPV4> ip6:<YOUR_SERVER_IPV6> ~all
 *
 * 2. DKIM record — cryptographically signs outgoing mail.
 *    Generate a key pair (e.g. with openssl or the nodemailer DKIM helper) and
 *    publish the *public* key as a TXT record.
 *    Type : TXT
 *    Name : <selector>._domainkey.qbreader.org   (e.g. default._domainkey)
 *    Value: v=DKIM1; k=rsa; p=<BASE64_PUBLIC_KEY>
 *    Then set the DKIM_PRIVATE_KEY and DKIM_SELECTOR environment variables.
 *    The transporter below will automatically sign mail when both are present.
 *
 * 3. DMARC record — tells receiving servers what to do with unauthenticated mail.
 *    Type : TXT
 *    Name : _dmarc.qbreader.org
 *    Value: v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@qbreader.org
 *
 * 4. PTR / rDNS record — the server's IP must resolve back to a hostname that
 *    forward-resolves back to the same IP (required by many receivers).
 *    Set this through your hosting / VPS provider's control panel:
 *    <YOUR_SERVER_IP> → mail.qbreader.org
 *    Then add:
 *    Type : A (and/or AAAA)
 *    Name : mail.qbreader.org
 *    Value: <YOUR_SERVER_IP>
 *    Note: this hostname must match the `name` option passed to createTransport below.
 *
 * 5. MX record — needed if you want to *receive* replies on the domain.
 *    Type    : MX
 *    Name    : @ (qbreader.org)
 *    Priority: 10
 *    Value   : mail.qbreader.org
 */

import { QBREADER_EMAIL_ADDRESS } from '../constants.js';

import { createTransport } from 'nodemailer';

// Direct transport resolves recipient MX records and delivers mail itself.
// No credentials are required.
// The `name` must match the PTR / rDNS record configured for the server's IP.
const transporterOptions = {
  direct: true,
  name: 'mail.qbreader.org'
};

// Sign outgoing mail with DKIM when the private key and selector are provided.
if (process.env.DKIM_PRIVATE_KEY && process.env.DKIM_SELECTOR) {
  transporterOptions.dkim = {
    domainName: 'qbreader.org',
    keySelector: process.env.DKIM_SELECTOR,
    privateKey: process.env.DKIM_PRIVATE_KEY
  };
}

const transporter = createTransport(transporterOptions);
// verify the transporter configuration on startup
if (process.env.DKIM_PRIVATE_KEY && process.env.DKIM_SELECTOR) {
  transporter.verify((error, success) => { if (error) { throw error; } });
}

/**
 *
 * @param {Object} param0
 * @param {String} param0.to
 * @param {String} [param0.subject='']
 * @param {String} param0.text
 * @param {String} param0.html
 * @returns
 */
export async function sendEmail ({ to, subject = '', text, html }) {
  const message = { from: QBREADER_EMAIL_ADDRESS, to, subject, text, html };

  try {
    return await transporter.sendMail(message);
  } catch (error) {
    console.log(error);
    return null;
  }
}
