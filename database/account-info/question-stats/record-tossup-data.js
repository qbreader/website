import { perTossupData } from '../collections.js';
import getUserId from '../get-user-id.js';

async function recordTossupData (username, { _id, celerity, isCorrect, multiplayer, pointValue }) {
  const userId = await getUserId(username);
  return await perTossupData.updateOne(
    { _id },
    { $push: { data: { user_id: userId, celerity, isCorrect, multiplayer, pointValue } } }
  );
}

export default recordTossupData;
