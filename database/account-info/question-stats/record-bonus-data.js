import { perBonusData } from '../collections.js';

export default async function recordBonusData (userId, { _id, pointsPerPart }) {
  return await perBonusData.updateOne(
    { _id },
    { $push: { data: { user_id: userId, created: new Date(), pointsPerPart } } }
  );
}
