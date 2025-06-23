import { sets, perTossupData, perBonusData, tossups, bonuses } from '../collections.js';

/**
 * Updates the difficulty level for a set and all related documents.
 *
 * This function updates the difficulty field for the set with the given name,
 * as well as all associated per-tossup, per-bonus, tossup, and bonus documents.
 * The `updatedAt` field is also updated for tossup and bonus documents.
 *
 * @param {string} setName - The name of the set to update.
 * @param {number} difficulty - The new difficulty level to set.
 * @returns {Promise<boolean>} Returns false if the set is not found, and true otherwise when all updates are successful.
*/
export default async function updateSetDifficulty (setName, difficulty) {
  const result = await sets.findOneAndUpdate(
    { name: setName },
    { $set: { difficulty } }
  );

  if (!result) { return false; }

  const _id = result._id;

  await perTossupData.updateMany(
    { set_id: _id },
    { $set: { difficulty } }
  );

  await perBonusData.updateMany(
    { set_id: _id },
    { $set: { difficulty } }
  );

  await tossups.updateMany(
    { 'set._id': _id },
    { $set: { difficulty, updatedAt: new Date() } }
  );

  await bonuses.updateMany(
    { 'set._id': _id },
    { $set: { difficulty, updatedAt: new Date() } }
  );

  return true;
}
