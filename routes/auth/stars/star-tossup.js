import { tossupStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} tossupId
 * @returns {Promise<boolean>} true if the tossup was not starred before
 */
async function starTossup (userId, tossupId) {
  // get whether a document was inserted
  const result = await tossupStars.updateOne(
    { user_id: userId, tossup_id: tossupId },
    { $set: { user_id: userId, tossup_id: tossupId } },
    { upsert: true }
  );
  return result.upsertedCount > 0;
}


const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let tossupId;
  try { tossupId = new ObjectId(req.body.tossup_id); } catch { return res.status(400).send('Invalid Tossup ID'); }
  await starTossup(userId, tossupId);
  res.sendStatus(200);
});

export default router;
