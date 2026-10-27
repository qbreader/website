import { packets, sets } from './collections.js';

/**
 * @param {String} packetName
 * @returns {Promise<{ set: { _id: ObjectId, name: string }, costInCents: number } | null>}
 */
async function getSetPayment (packetName) {
  const packet = await packets.findOne({ name: packetName }, { projection: { set: 1 } });
  if (!packet?.set) {
    return null;
  }

  const set = await sets.findOne({ _id: packet.set._id }, { projection: { name: 1, payment: 1 } });
  if (!set?.payment?.perSet) {
    return null;
  }

  return { set: { _id: set._id, name: set.name }, costInCents: set.payment.costInCents };
}

export default getSetPayment;
