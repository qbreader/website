import { emailCollation, users } from './collections.js';

// find accounts with verified email that matches param email
export default async function getVerifiedUsernamesByEmail (email) {
  const matches = await users.find(
    { email, verifiedEmail: true },
    { collation: emailCollation, projection: { username: 1, _id: 0 }, limit: 2 }
  ).toArray();

  return matches.map(user => user.username);
}
