import { packets } from './collections.js';

/**
 * Mirrors `getCost`: a packet is free if it has no cost of its own, and a set-wide payment
 * replaces the packet's cost unless it has no amount.
 * @param {{ costInCents?: number, sets: Array<{ payment?: { perSet?: boolean, costInCents?: number } }> }} packet - a packet with its set joined in
 * @returns {boolean} whether the packet costs more than $0
 */
function isPaid ({ costInCents, sets }) {
  if (!costInCents) { return false; }

  const payment = sets[0]?.payment;
  const setCostInCents = payment?.perSet ? payment.costInCents : undefined;
  return (setCostInCents ?? costInCents) > 0;
}

/**
 * @param {ObjectId} setId
 * @returns {Promise<String[]>} the names of the set's packets that cost more than $0, in play order.
 * Free packets (and test packets) are left out of cumulative stats.
 */
async function getPaidSetPacketNames (setId) {
  const packetList = await packets.aggregate([
    { $match: { 'set._id': setId, test: { $ne: true } } },
    { $sort: { order: 1 } },
    { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'sets' } },
    { $project: { _id: 0, name: 1, costInCents: 1, 'sets.payment': 1 } }
  ]).toArray();

  return packetList.filter(isPaid).map(({ name }) => name);
}

export default getPaidSetPacketNames;
