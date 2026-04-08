import { bonusStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} bonusId
 * @returns {Promise<boolean>} true if the bonus was not starred before
 */
async function starBonus (userId, bonusId) {
  // get whether a document was inserted
  const result = await bonusStars.updateOne(
    { user_id: userId, bonus_id: bonusId },
    { $set: { user_id: userId, bonus_id: bonusId } },
    { upsert: true }
  );
  return result.upsertedCount > 0;
}


const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let bonusId;
  try { bonusId = new ObjectId(req.body.bonus_id); } catch { return res.status(400).send('Invalid Bonus ID'); }
  await starBonus(userId, bonusId);
  res.sendStatus(200);
});

export default router;
