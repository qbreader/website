import getUserId from '../../../database/account-info/get-user-id.js';
import recordTossupData from '../../../database/account-info/question-stats/record-tossup-data.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

/**
 * Validates the parameters for recording the stats of a played tossup.
 *
 * @param {object} params - The parameters to validate.
 * @param {ObjectId | string} params._id - The _id of the tossup.
 * @param {string | number} params.celerity - The celerity value, should be a number between 0 and 1.
 * @param {string | boolean} params.isCorrect - Indicates if the answer is correct, should be 'true' or 'false'.
 * @param {string | number} params.pointValue - The point value of the tossup.
 * @param {string | boolean} params.multiplayer - Indicates if the game is multiplayer, should be 'true' or 'false'.
 * @returns {{
 *  _id: ObjectId,
 *  celerity: number,
 *  isCorrect: boolean,
 *  pointValue: number,
 *  multiplayer: boolean
 * } | null} The validated parameters or null if validation fails.
 */
function validateParams ({ _id, celerity, isCorrect, multiplayer, pointValue }) {
  if (!_id) { return null; }
  try {
    _id = new ObjectId(_id);
  } catch (e) {
    return null;
  }

  if (isNaN(parseFloat(celerity)) || celerity < 0 || celerity > 1) { return null; }

  if (isCorrect === 'true') { isCorrect = true; } else if (isCorrect === 'false') { isCorrect = false; }
  if (typeof isCorrect !== 'boolean') { return null; }

  if (isNaN(parseInt(pointValue))) { return null; }

  if (multiplayer === 'true') { multiplayer = true; } else if (multiplayer === 'false') { multiplayer = false; }
  if (typeof multiplayer !== 'boolean') { return null; }

  return { _id, celerity, isCorrect, pointValue, multiplayer };
}

router.post('/', async (req, res) => {
  const { username } = req.session;
  const userId = await getUserId(username);
  if (!userId) {
    return res.status(401).send('Unauthorized');
  }
  const params = validateParams(req.body);
  if (params === null) {
    return res.status(400).send('Invalid parameters');
  }
  const results = await recordTossupData(userId, params);
  res.json(results);
});

export default router;
