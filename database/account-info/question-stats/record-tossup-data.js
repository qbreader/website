import { perTossupData } from '../collections.js';
import getUserId from '../get-user-id.js';

import { ObjectId } from 'mongodb';

async function recordTossupData (username, { tossup, celerity, isCorrect, pointValue, multiplayer }) {
  const userId = await getUserId(username);
  const newData = {
    user_id: userId,
    celerity,
    isCorrect,
    pointValue,
    multiplayer,
    category: tossup.category,
    subcategory: tossup.subcategory,
    alternate_subcategory: tossup.alternate_subcategory,
    difficulty: tossup.difficulty
  };

  try {
    newData.tossup_id = new ObjectId(tossup._id);
    newData.set_id = new ObjectId(tossup.set._id);
  } catch (e) {
    return null;
  }
  return await perTossupData.insertOne(newData);
}

export default recordTossupData;
