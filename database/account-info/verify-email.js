import { users } from './collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<Result>}
 */
async function verifyEmail (userId) {
  return await users.updateOne(
    { _id: userId },
    { $set: { verifiedEmail: true } }
  );
}

export default verifyEmail;
