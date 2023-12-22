import { bonusStars } from '../collections.js';

async function isStarredBonus(user_id, bonus_id) {
    const count = await bonusStars.countDocuments({ user_id, bonus_id });
    return count > 0;
}

export default isStarredBonus;
