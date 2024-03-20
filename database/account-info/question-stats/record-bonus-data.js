import { bonusData } from '../collections.js';
import getUserId from '../get-user-id.js';

import { ObjectId } from 'mongodb';

async function recordBonusData(username, data) {
    const user_id = await getUserId(username);
    const { bonus } = data;
    const newData = {};
    for (const field of ['pointsPerPart']) {
        if (!data[field]) {
            return false;
        } else {
            newData[field] = data[field];
        }
    }

    if (!Object.prototype.hasOwnProperty.call(data, 'bonus')) {
        return false;
    }

    for (const field of ['category', 'subcategory', 'alternate_subcategory', 'difficulty']) {
        if (Object.prototype.hasOwnProperty.call(bonus, field)) {
            newData[field] = bonus[field];
        }
    }

    newData.bonus_id = new ObjectId(bonus._id);
    newData.set_id = new ObjectId(bonus.set._id);
    newData.user_id = user_id;
    newData.createdAt = new Date();
    return await bonusData.insertOne(newData);
}

export default recordBonusData;
