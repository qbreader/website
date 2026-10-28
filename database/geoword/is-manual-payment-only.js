import { packets, sets } from './collections.js';

/**
 * @param {String} packetName
 * @returns {Promise<Boolean>} true if the packet's set only accepts manual payments (no Stripe).
 */
async function isManualPaymentOnly (packetName) {
  const packet = await packets.findOne({ name: packetName }, { projection: { set: 1 } });
  if (!packet?.set) {
    return false;
  }

  const set = await sets.findOne({ _id: packet.set._id }, { projection: { payment: 1 } });
  return !!set?.payment?.manualOnly;
}

export default isManualPaymentOnly;
