import { bonusData } from '../collections.js';
import getUserId from '../get-user-id.js';

import { ObjectId } from 'mongodb';

async function recordBonusData (username, data) {
  const userId = await getUserId(username);
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

  try {
    newData.bonus_id = new ObjectId(bonus._id);
    newData.set_id = new ObjectId(bonus.set._id);
  } catch (e) {
    return false;
  }

  newData.user_id = userId;
  return await bonusData.insertOne(newData);
}

export default recordBonusData;
