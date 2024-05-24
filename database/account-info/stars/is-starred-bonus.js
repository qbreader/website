import { bonusStars } from '../collections.js';

async function isStarredBonus (userId, bonusId) {
  const count = await bonusStars.countDocuments({ user_id: userId, bonus_id: bonusId });
  return count > 0;
}

export default isStarredBonus;
