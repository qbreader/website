import recordBonusData from '../../../database/account-info/question-stats/record-bonus-data.js';
import { checkToken } from '../../../server/authentication.js';

import { Router } from 'express';

const router = Router();

/**
 * Validates the parameters for recording the stats of a played bonus.
 *
 * @param {object} params - The parameters to validate.
 * @param {object} params.tossup - The bonus object.
 * @param {number[]} params.pointsPerPart - The points per part of the bonus.
 * @returns {{
 *  tossup: object,
 *  pointsPerPart: number[]
 * } | null} The validated parameters or null if validation fails.
 */
function validateParams ({ bonus, pointsPerPart }) {
  if (bonus?.constructor !== Object) { return null; }

  for (const key of ['category', 'subcategory', '_id']) {
    if (typeof bonus[key] !== 'string') {
      return null;
    }
  }
  if (isNaN(parseInt(bonus.difficulty)) || bonus.difficulty < 0 || bonus.difficulty > 10) { return null; }
  if (bonus.alternate_subcategory !== undefined && typeof bonus.alternate_subcategory !== 'string') { return null; }
  if (typeof bonus?.set?._id !== 'string') { return null; }

  if (!Array.isArray(pointsPerPart)) { return null; }
  if (pointsPerPart.some(points => typeof points !== 'number')) { return null; }

  return { bonus, pointsPerPart };
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
  const results = await recordBonusData(username, params);
  res.json(results);
});

export default router;
