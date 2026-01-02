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
    { $addFields: { insertTime: { $toDate: '$_id' } } },
    { $sort: { insertTime: -1 } }
  ).toArray();
}
