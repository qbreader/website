import { perBonusData } from '../collections.js';
import getUserId from '../get-user-id.js';

async function recordBonusData (username, { _id, pointsPerPart }) {
  const userId = await getUserId(username);
  return await perBonusData.updateOne(
    { _id },
    { $push: { data: { user_id: userId, pointsPerPart } } }
  );
}

export default recordBonusData;
