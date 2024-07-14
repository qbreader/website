import getTossupIds from './get-ids-tossup.js';
import { tossups } from '../../qbreader/collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<types.Tossup[]>}
 */
export default async function getTossupStars (userId) {
  const tossupIds = await getTossupIds(userId);
  return await tossups.find(
    { _id: { $in: tossupIds } },
    {
      sort: {
        'set.name': -1,
        'packet.number': 1,
        number: 1
      }
    }
  ).toArray();
}
