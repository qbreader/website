import { bonusStars } from '../collections.js';

import { bonuses } from '../../qbreader/collections.js';

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

    const bonus_ids = await bonusStars.aggregate(aggregation).toArray();
    return await bonuses.find(
        { _id: { $in: bonus_ids.map(bonus => bonus.bonus_id) } },
        { sort: {
            'set.name': -1,
            'packet.number': 1,
            number: 1,
        } },
    ).toArray();
}

export default getBonusStars;
