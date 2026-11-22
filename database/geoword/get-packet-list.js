import { packets } from './collections.js';

/**
 * Packets are ordered by their set's `order`, then by name (numbers compared numerically, so "Packet 2" precedes "Packet 10").
 * @returns {Promise<Array<{ name: string, divisions: string[], set?: { name: string } }>>}
 */
async function getPacketList () {
  return await packets.aggregate([
    { $match: { test: { $ne: true } } },
    { $lookup: { from: 'sets', localField: 'set._id', foreignField: '_id', as: 'setInfo' } },
    { $sort: { 'setInfo.order': 1, name: 1 } },
    { $project: { name: 1, divisions: 1, 'set.name': 1, _id: 0 } }
  ], { collation: { locale: 'en', numericOrdering: true } }).toArray();
}

export default getPacketList;
