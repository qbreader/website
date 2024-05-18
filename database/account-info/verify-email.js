import { users } from './collections.js';

import { ObjectId } from 'mongodb';

/**
 *
 * @param {String} user_id
 * @returns {Promise<Result>}
 */
async function verifyEmail (user_id) {
  return await users.updateOne(
    { _id: new ObjectId(user_id) },
    { $set: { verifiedEmail: true } }
  );
}

export default verifyEmail;
