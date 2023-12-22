import { tossupStars } from '../collections.js';

import getTossup from '../../qbreader/get-tossup.js';

/**
 *
 * @param {ObjectId} user_id
 * @returns {Promise<types.Tossup[]>}
 */
async function getTossupStars(user_id) {
    const aggregation = [
        { $match: { user_id } },
        { $addFields: { 'insertTime': { '$toDate': '$_id' } } },
        { $sort: { insertTime: -1 } },
    ];

    const tossups = await tossupStars.aggregate(aggregation).toArray();
    for (const tossup of tossups) {
        tossup.tossup = await getTossup(tossup.tossup_id);
    }
    return tossups.map(star => star.tossup);
}

export default getTossupStars;
