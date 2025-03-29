import { perBonusData } from '../collections.js';
import getUserId from '../get-user-id.js';

import { ObjectId } from 'mongodb';

async function recordBonusData (username, { bonus, pointsPerPart }) {
  const userId = await getUserId(username);
  const newData = {
    user_id: userId,
    pointsPerPart,
    category: bonus.category,
    subcategory: bonus.subcategory,
    alternate_subcategory: bonus.alternate_subcategory,
    difficulty: bonus.difficulty
  };

  try {
    newData.bonus_id = new ObjectId(bonus._id);
    newData.set_id = new ObjectId(bonus.set._id);
  } catch (e) {
    return null;
  }

  return await perBonusData.insertOne(newData);
}

export default recordBonusData;
