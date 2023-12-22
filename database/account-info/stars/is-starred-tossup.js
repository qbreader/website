import { tossupStars } from '../collections.js';

async function isStarredTossup(user_id, tossup_id) {
    const count = await tossupStars.countDocuments({ user_id, tossup_id });
    return count > 0;
}

export default isStarredTossup;
