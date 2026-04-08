import { perTossupData } from '../../../database/account-info/collections.js';

export default async function recordTossupData (userId, { _id, celerity, isCorrect, multiplayer, pointValue }) {
  return await perTossupData.updateOne(
    { _id },
    { $push: { data: { user_id: userId, created: new Date(), celerity, isCorrect, multiplayer, pointValue } } }
  );
}
