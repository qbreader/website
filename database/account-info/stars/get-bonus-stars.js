import { bonusStars } from '../collections.js';

import { bonuses } from '../../qbreader/collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<types.Bonus[]>}
 */
async function getBonusStars (userId) {
  const aggregation = [
    { $match: { user_id: userId } },
    { $addFields: { insertTime: { $toDate: '$_id' } } },
    { $sort: { insertTime: -1 } }
  ];

  const bonusIds = await bonusStars.aggregate(aggregation).toArray();
  return await bonuses.find(
    { _id: { $in: bonusIds.map(bonus => bonus.bonus_id) } },
    {
      sort: {
        'set.name': -1,
        'packet.number': 1,
        number: 1
      }
    }
  ).toArray();
}

export default getBonusStars;
