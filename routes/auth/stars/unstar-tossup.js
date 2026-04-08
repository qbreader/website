import { tossupStars } from '../../../database/account-info/collections.js';
import getUserId from '../../../database/account-info/get-user-id.js';
import { Router } from 'express';
import { ObjectId } from 'mongodb';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} tossupId
 * @returns {Promise<number>} - the number of tossup star documents deleted
 */
async function unstarTossup (userId, tossupId) {
  return (await tossupStars.deleteMany({ user_id: userId, tossup_id: tossupId })).deletedCount;
}


const router = Router();

router.put('/', async (req, res) => {
  const username = req.session.username;
  const userId = await getUserId(username);
  let tossupId;
  try { tossupId = new ObjectId(req.body.tossup_id); } catch { return res.status(400).send('Invalid Tossup ID'); }
  await unstarTossup(userId, tossupId);
  res.sendStatus(200);
});

export default router;
