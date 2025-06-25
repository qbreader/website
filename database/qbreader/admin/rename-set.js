import { sets, tossups, bonuses, packets } from '../collections.js';

/**
 * Renames a quizbowl set.
 *
 * @param {string} oldName - The current name of the set to be renamed. Returns false if the set does not exist.
 * @param {string} newName - The new name for the set. The first 4 characters should represent the year. Returns false if the year is invalid.
 * @returns {Promise<boolean>} Returns true if the set was successfully renamed and related documents updated, false otherwise.
 */
export default async function renameSet (oldName, newName) {
  if (newName.length < 4) { return false; }
  const year = parseInt(newName.slice(0, 4));
  if (isNaN(year)) { return false; }

  if (await sets.findOne({ name: newName })) { return false; }

  const set = await sets.findOneAndUpdate(
    { name: oldName },
    { $set: { name: newName, year } }
  );

  if (!set) { return false; }

  await Promise.all([
    tossups.updateMany(
      { 'set._id': set._id },
      { $set: { 'set.name': newName, 'set.year': year, updatedAt: new Date() } }
    ),
    bonuses.updateMany(
      { 'set._id': set._id },
      { $set: { 'set.name': newName, 'set.year': year, updatedAt: new Date() } }
    ),
    packets.updateMany(
      { 'set._id': set._id },
      { $set: { 'set.name': newName } }
    )]);

  return true;
}
