import { tossupStars } from '../collections.js';

/**
 *
 * @param {ObjectId} user_id
 * @param {ObjectId} tossup_id
 * @returns {Promise<boolean>} true if the tossup was not starred before
 */
async function starTossup (user_id, tossup_id) {
  if (await tossupStars.findOne({ user_id, tossup_id })) {
    return false;
  }

  await tossupStars.insertOne({ user_id, tossup_id });
  return true;
}

export default starTossup;
