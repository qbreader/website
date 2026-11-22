import { packets } from './collections.js';

import getCost from './get-cost.js';

/**
 * @param {ObjectId} setId
 * @returns {Promise<String[]>} the names of the set's packets that cost more than $0, in play order.
 * Free packets (and test packets) are left out of cumulative stats.
 */
async function getPaidSetPacketNames (setId) {
  const packetList = await packets.find(
    { 'set._id': setId, test: { $ne: true } },
    { sort: { order: 1 }, projection: { name: 1, _id: 0 } }
  ).toArray();

  const costs = await Promise.all(packetList.map(({ name }) => getCost(name)));
  return packetList.filter((_, index) => costs[index] > 0).map(({ name }) => name);
}

export default getPaidSetPacketNames;
