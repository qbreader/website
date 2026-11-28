import { packets } from './collections.js';

/**
 * @param {ObjectId} setId
 * @returns {Promise<String[]>} the names of the set's packets that count toward cumulative stats, in play order.
 * Test packets and packets with `excludeFromSetStats` are left out.
 */
async function getPacketNamesForSetStats (setId) {
  const packetList = await packets.find(
    { 'set._id': setId, test: { $ne: true }, excludeFromSetStats: { $ne: true } },
    { sort: { order: 1 }, projection: { name: 1, _id: 0 } }
  ).toArray();

  return packetList.map(({ name }) => name);
}

export default getPacketNamesForSetStats;
