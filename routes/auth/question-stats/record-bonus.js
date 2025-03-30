import getUserId from '../../../database/account-info/get-user-id.js';
import recordBonusData from '../../../database/account-info/question-stats/record-bonus-data.js';

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();

/**
 * Validates the parameters for recording the stats of a played bonus.
 *
 * @param {object} params - The parameters to validate.
 * @param {ObjectId | string} params._id - The _id of the bonus.
 * @param {number[]} params.pointsPerPart - The points per part of the bonus.
 * @returns {{
 *  _id: ObjectId,
 *  pointsPerPart: number[]
 * } | null} The validated parameters or null if validation fails.
 */
function validateParams ({ _id, pointsPerPart }) {
  if (!_id) { return null; }
  try {
    _id = new ObjectId(_id);
  } catch (e) {
    return null;
  }

  if (!Array.isArray(pointsPerPart)) { return null; }
  if (pointsPerPart.some(points => typeof points !== 'number')) { return null; }

  return { _id, pointsPerPart };
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
  const results = await recordBonusData(userId, params);
  res.json(results);
});

export default router;
