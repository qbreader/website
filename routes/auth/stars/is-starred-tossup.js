import { tossupStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

async function isStarredTossup (userId, tossupId) {
  const count = await tossupStars.countDocuments({ user_id: userId, tossup_id: tossupId });
  return count > 0;
}


const router = Router();

router.get('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let tossupId;
  try { tossupId = new ObjectId(req.query.tossup_id); } catch { return res.status(400).send('Invalid Tossup ID'); }
  res.json({ isStarred: await isStarredTossup(userId, tossupId) });
});

export default router;
