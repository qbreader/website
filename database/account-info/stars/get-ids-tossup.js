import { tossupStars } from '../collections.js';

/**
 * Get the ids of a user's starred tossups.
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<ObjectId[]>} The tossup IDs
 */
export default async function getTossupIds (userId) {
  const aggregation = [
    { $match: { user_id: userId } },
    { $addFields: { insertTime: { $toDate: '$_id' } } },
    { $sort: { insertTime: -1 } }
  ];

  const tossupIds = await tossupStars.aggregate(aggregation).toArray();
  return tossupIds.map(tossup => tossup.tossup_id);
}
