import { bonusStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

async function isStarredBonus (userId, bonusId) {
  const count = await bonusStars.countDocuments({ user_id: userId, bonus_id: bonusId });
  return count > 0;
}


const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let bonusId;
  try { bonusId = new ObjectId(req.query.bonus_id); } catch { return res.status(400).send('Invalid Bonus ID'); }
  res.json({ isStarred: await isStarredBonus(userId, bonusId) });
});

export default router;
