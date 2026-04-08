import { bonuses, tossups } from '../../../database/qbreader/collections.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

/**
 * Deletes the reports from a single tossup or bonus.
 * @param {ObjectId} _id - The unique identifier of the document to update.
 * @param {'tossup' | 'bonus'} type - The type of document to update ('tossup' or 'bonus').
 * @returns The result of the update operation.
 */
async function clearReports (_id, type) {
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

const router = Router();

router.put('/', async (req, res) => {
  let { _id, type } = req.body;
  try { _id = new ObjectId(_id); } catch (e) { return res.status(400).send('Invalid ID'); }
  const result = await clearReports(_id, type);
  res.sendStatus(result.modifiedCount > 0 ? 200 : 500);
});

export default router;
