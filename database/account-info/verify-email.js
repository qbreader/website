import { users } from './collections.js';

import { ObjectId } from 'mongodb';

/**
 *
 * @param {String} userId
 * @returns {Promise<Result>}
 */
async function verifyEmail (userId) {
  return await users.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { verifiedEmail: true } }
  );
}

export default verifyEmail;
