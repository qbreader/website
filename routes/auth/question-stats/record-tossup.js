import recordTossupData from '../../../database/account-info/question-stats/record-tossup-data.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

/**
 * Validates the parameters for recording the stats of a played tossup.
 *
 * @param {object} params - The parameters to validate.
 * @param {object} params.tossup - The tossup object.
 * @param {string | number} params.celerity - The celerity value, should be a number between 0 and 1.
 * @param {string | boolean} params.isCorrect - Indicates if the answer is correct, should be 'true' or 'false'.
 * @param {string | number} params.pointValue - The point value of the tossup.
 * @param {string | boolean} params.multiplayer - Indicates if the game is multiplayer, should be 'true' or 'false'.
 * @returns {{
 *  tossup: object,
 *  celerity: number,
 *  isCorrect: boolean,
 *  pointValue: number,
 *  multiplayer: boolean
 * } | null} The validated parameters or null if validation fails.
 */
function validateParams ({ tossup, celerity, isCorrect, pointValue, multiplayer }) {
  if (tossup?.constructor !== Object) { return null; }

  for (const key of ['category', 'subcategory', '_id']) {
    if (typeof tossup[key] !== 'string') {
      return null;
    }
  }
  if (isNaN(parseInt(tossup.difficulty)) || tossup.difficulty < 0 || tossup.difficulty > 10) { return null; }
  if (tossup.alternate_subcategory !== undefined && typeof tossup.alternate_subcategory !== 'string') { return null; }
  if (typeof tossup?.set?._id !== 'string') { return null; }

  if (isNaN(parseFloat(celerity)) || celerity < 0 || celerity > 1) { return null; }

  if (isCorrect === 'true') { isCorrect = true; } else if (isCorrect === 'false') { isCorrect = false; }
  if (typeof isCorrect !== 'boolean') { return null; }

  if (isNaN(parseInt(pointValue))) { return null; }

  if (multiplayer === 'true') { multiplayer = true; } else if (multiplayer === 'false') { multiplayer = false; }
  if (typeof multiplayer !== 'boolean') { return null; }

  return { tossup, celerity, isCorrect, pointValue, multiplayer };
}

router.post('/', async (req, res) => {
  const { username, token } = req.session;
  if (!checkToken(username, token)) {
    delete req.session;
    res.sendStatus(401);
    return;
  }

  if (!checkToken(username, token, true)) {
    res.sendStatus(403);
    return;
  }

  const params = validateParams(req.body);
  if (params === null) {
    return res.status(400).send('Invalid parameters');
  }
  const results = await recordTossupData(username, params);
  res.json(results);
});

export default router;
