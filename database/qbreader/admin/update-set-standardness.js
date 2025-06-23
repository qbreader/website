import { sets, tossups, bonuses } from '../collections.js';

export default async function updateSetStandardness (setName, standard) {
  const set = await sets.findOneAndUpdate(
    { name: setName },
    { $set: { standard } }
  );

  if (!set) { return false; }

  const _id = set._id;

  await tossups.updateMany(
    { 'set._id': _id },
    { $set: { 'set.standard': standard, updatedAt: new Date() } }
  );

  await bonuses.updateMany(
    { 'set._id': _id },
    { $set: { 'set.standard': standard, updatedAt: new Date() } }
  );

  return true;
}
