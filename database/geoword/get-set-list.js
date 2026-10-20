import { packets } from './collections.js';

/**
 * @returns {Promise<Array<{ name: string }>>}
 */
async function getSetList () {
  return await packets.aggregate([
    { $match: { test: { $ne: true }, set: { $exists: true } } },
    { $group: { _id: '$set._id', name: { $first: '$set.name' }, order: { $min: '$order' } } },
    { $sort: { order: 1 } },
    { $project: { _id: 0, name: 1 } }
  ]).toArray();
}

export default getSetList;
