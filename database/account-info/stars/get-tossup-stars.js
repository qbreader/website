import { tossupStars } from '../collections.js';

import { tossups } from '../../qbreader/collections.js';

/**
 *
 * @param {ObjectId} user_id
 * @returns {Promise<types.Tossup[]>}
 */
async function getTossupStars (user_id) {
  const aggregation = [
    { $match: { user_id } },
    { $addFields: { insertTime: { $toDate: '$_id' } } },
    { $sort: { insertTime: -1 } }
  ];

  const tossup_ids = await tossupStars.aggregate(aggregation).toArray();
  return await tossups.find(
    { _id: { $in: tossup_ids.map(tossup => tossup.tossup_id) } },
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
