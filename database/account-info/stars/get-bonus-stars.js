import { bonusStars } from '../collections.js';

import getBonus from '../../qbreader/get-bonus.js';

/**
 *
 * @param {ObjectId} user_id
 * @returns {Promise<types.Bonus[]>}
 */
async function getBonusStars(user_id) {
    const aggregation = [
        { $match: { user_id } },
        { $addFields: { 'insertTime': { '$toDate': '$_id' } } },
        { $sort: { insertTime: -1 } },
    ];

    const bonuses = await bonusStars.aggregate(aggregation).toArray();
    for (const bonus of bonuses) {
        bonus.bonus = await getBonus(bonus.bonus_id);
    }
    return bonuses.map(star => star.bonus);
}

export default getBonusStars;
