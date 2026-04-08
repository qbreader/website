import { bonusStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} bonusId
 * @returns {Promise<number>} - the number of bonus star documents deleted
 */
async function unstarBonus (userId, bonusId) {
  return (await bonusStars.deleteMany({ user_id: userId, bonus_id: bonusId })).deletedCount;
}


const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let bonusId;
  try { bonusId = new ObjectId(req.body.bonus_id); } catch { return res.status(400).send('Invalid Bonus ID'); }
  await unstarBonus(userId, bonusId);
  res.sendStatus(200);
});

export default router;
