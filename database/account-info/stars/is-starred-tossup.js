import { tossupStars } from '../collections.js';

async function isStarredTossup (userId, tossupId) {
  const count = await tossupStars.countDocuments({ user_id: userId, tossup_id: tossupId });
  return count > 0;
}

export default isStarredTossup;
