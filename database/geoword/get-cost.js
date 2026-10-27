import { packets } from './collections.js';

import getSetPayment from './get-set-payment.js';

/**
 * @param {String} packetName
 * @returns {Integer} the cost to play the packet, in cents (USD)
 */
async function getCost (packetName) {
  const packet = await packets.findOne({ name: packetName });
  if (!packet?.costInCents) { return 0; }

  const setPayment = await getSetPayment(packetName);
  return setPayment?.costInCents ?? packet.costInCents;
}

export default getCost;
