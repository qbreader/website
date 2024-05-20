import { tossupStars } from '../collections.js';

import { tossups } from '../../qbreader/collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<types.Tossup[]>}
 */
async function getTossupStars (userId) {
  const aggregation = [
    { $match: { user_id: userId } },
    { $addFields: { insertTime: { $toDate: '$_id' } } },
    { $sort: { insertTime: -1 } }
  ];

  const tossupIds = await tossupStars.aggregate(aggregation).toArray();
  return await tossups.find(
    { _id: { $in: tossupIds.map(tossup => tossup.tossup_id) } },
    {
      sort: {
        'set.name': -1,
        'packet.number': 1,
        number: 1
      }
    }
  ).toArray();
}

export default getTossupStars;
