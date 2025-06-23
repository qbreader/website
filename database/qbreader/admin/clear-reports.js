import { bonuses, tossups } from '../collections.js';

/**
 * Deletes the reports from a single tossup or bonus.
 * @param {ObjectId} _id - The unique identifier of the document to update.
 * @param {'tossup' | 'bonus'} type - The type of document to update ('tossup' or 'bonus').
 * @returns The result of the update operation.
 */
export default async function clearReports (_id, type) {
  switch (type) {
    case 'tossup':
      return await tossups.updateOne(
        { _id },
        { $unset: { reports: 1 } }
      );
    case 'bonus':
      return await bonuses.updateOne(
        { _id },
        { $unset: { reports: 1 } }
      );
  }
}
