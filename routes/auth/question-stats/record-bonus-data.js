import { perBonusData } from '../../../database/account-info/collections.js';

export default async function recordBonusData (userId, { _id, multiplayer, pointsPerPart }) {
  return await perBonusData.updateOne(
    { _id },
    { $push: { data: { user_id: userId, created: new Date(), multiplayer, pointsPerPart } } }
  );
}
