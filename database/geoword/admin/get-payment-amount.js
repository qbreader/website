import getCost from '../get-cost.js';
import getSet from '../get-set.js';

/**
 * @param {object} payment
 * @returns {Promise<Integer>} the amount of the payment, in cents (USD)
 */
async function getPaymentAmount (payment) {
  if (payment.amountInCents !== null && payment.amountInCents !== undefined) {
    return payment.amountInCents;
  }

  if (payment.packet) {
    return await getCost(payment.packet.name);
  }

  const set = await getSet(payment.set.name);
  return set?.payment?.costInCents ?? 0;
}

export default getPaymentAmount;
