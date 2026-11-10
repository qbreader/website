import { emailCollation, users } from './collections.js';

/**
 * Case-insensitively find the accounts whose verified email matches `email`.
 * @param {string} email
 * @returns {Promise<string[]>} At most two usernames, which is enough to tell whether the match is unique.
 */
export default async function getVerifiedUsernamesByEmail (email) {
  const matches = await users.find(
    { email, verifiedEmail: true },
    { collation: emailCollation, projection: { username: 1, _id: 0 }, limit: 2 }
  ).toArray();

  return matches.map(user => user.username);
}
