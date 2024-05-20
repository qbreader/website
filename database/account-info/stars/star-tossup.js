import { tossupStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} tossupId
 * @returns {Promise<boolean>} true if the tossup was not starred before
 */
async function starTossup (userId, tossupId) {
  if (await tossupStars.findOne({ user_id: userId, tossup_id: tossupId })) {
    return false;
  }

  await tossupStars.insertOne({ user_id: userId, tossup_id: tossupId });
  return true;
}

export default starTossup;
