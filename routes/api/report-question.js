import { bonuses, tossups } from '../../database/qbreader/collections.js';
import { ObjectId } from 'mongodb';
import { Router } from 'express';

/**
 * Report question with given id to the database.
 * @param {ObjectId} _id - the id of the question to report
 * @param {'wrong-category' | 'text-error' | 'answer-checking' | 'other'} reason - the reason for reporting
 * @param {string} description - a description of the problem
 * @param {boolean} [verbose=false] - whether to log the result to the console
 * @returns {Promise<boolean>} true if successful, false otherwise.
 */
async function reportQuestion (_id, reason, description, verbose = false) {
  await tossups.updateOne(
    { _id },
    { $push: { reports: { reason, description } } }
  );

  await bonuses.updateOne(
    { _id },
    { $push: { reports: { reason, description } } }
  );

  if (verbose) {
    console.log('Reported question with id ' + _id);
  }

  return true;
}


const router = Router();

router.post('/', async (req, res) => {
  let _id;
  try { _id = new ObjectId(req.body._id); } catch (e) {
    return res.status(400).send('Invalid ID');
  }

  const reason = req.body.reason ?? '';
  const description = req.body.description ?? '';
  const successful = await reportQuestion(_id, reason, description);
  if (successful) {
    return res.sendStatus(200);
  } else {
    return res.sendStatus(500);
  }
});

export default router;
