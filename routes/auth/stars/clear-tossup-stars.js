import { tossupStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<number>} The number of tossup stars cleared.
 */
async function clearTossupStars (userId) {
  const result = await tossupStars.deleteMany({ user_id: userId });
  return result.deletedCount;
}

const router = Router();

router.delete('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  const count = await clearTossupStars(userId);
  res.status(200).json({ count });
});

export default router;
