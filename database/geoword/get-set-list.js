import { packets } from './collections.js';

/**
 * @returns {Promise<Array<{ name: string }>>} the sets with team registration open and at least one public packet, in packet order
 */
async function getSetList () {
  return await packets.aggregate([
    { $match: { test: { $ne: true }, set: { $exists: true } } },
    { $group: { _id: '$set._id', name: { $first: '$set.name' }, order: { $min: '$order' } } },
    { $lookup: { from: 'sets', localField: '_id', foreignField: '_id', as: 'set' } },
    { $match: { 'set.teamsEnabled': true } },
    { $sort: { order: 1 } },
    { $project: { _id: 0, name: 1 } }
  ]).toArray();
}

export default getSetList;
