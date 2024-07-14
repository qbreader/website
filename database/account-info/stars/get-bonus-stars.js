import getBonusIds from './get-ids-bonus.js';
import { bonuses } from '../../qbreader/collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<types.Bonus[]>}
 */
export default async function getBonusStars (userId) {
  const bonusIds = await getBonusIds(userId);
  return await bonuses.find(
    { _id: { $in: bonusIds } },
    {
      sort: {
        'set.name': -1,
        'packet.number': 1,
        number: 1
      }
    }
  ).toArray();
}
