import { tossupStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} tossupId
 * @returns {Promise<boolean>} true if the tossup was not starred before
 */
async function starTossup (userId, tossupId) {
  // get whether a document was inserted
  const result = await tossupStars.updateOne(
    { user_id: userId, tossup_id: tossupId },
    { $set: { user_id: userId, tossup_id: tossupId } },
    { upsert: true }
  );
  return result.upsertedCount > 0;
}

export default starTossup;
