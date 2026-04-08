import { idToUsername, users } from '../../database/account-info/collections.js';
import { checkToken } from '../../server/authentication.js';
import { Router } from 'express';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<String>}
 */
export async function getUsername (userId) {
  if (idToUsername[userId]) {
    return idToUsername[userId];
  }

  const user = await users.findOne({ _id: userId });

  if (!user) {
    return null;
  }

  idToUsername[userId] = user.username;
  return user.username;
}

const router = Router();

router.get('/', async (req, res) => {
  const { username, token, expires } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  res.json({ username, expires });
});

export default router;
