import { bonusStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<number>} The number of bonus stars cleared.
 */
async function clearBonusStars (userId) {
  const result = await bonusStars.deleteMany({ user_id: userId });
  return result.deletedCount;
}

const router = Router();

router.delete('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  const count = await clearBonusStars(userId);
  res.status(200).json({ count });
});

export default router;
