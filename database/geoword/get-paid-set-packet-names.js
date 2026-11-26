import { packets, sets } from './collections.js';

import { getPacketCost } from './get-cost.js';

/**
 * @param {ObjectId} setId
 * @returns {Promise<String[]>} the names of the set's packets that cost more than $0, in play order.
 * Free packets (and test packets) are left out of cumulative stats.
 */
async function getPaidSetPacketNames (setId) {
  const [packetList, set] = await Promise.all([
    packets.find(
      { 'set._id': setId, test: { $ne: true } },
      { sort: { order: 1 }, projection: { name: 1, costInCents: 1, _id: 0 } }
    ).toArray(),
    sets.findOne({ _id: setId }, { projection: { payment: 1 } })
  ]);

  return packetList.filter(packet => getPacketCost(packet, set) > 0).map(({ name }) => name);
}

export default getPaidSetPacketNames;
