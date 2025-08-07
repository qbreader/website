import getFrequencyList from '../../database/qbreader/get-frequency-list.js';
import { DIFFICULTIES } from '../../quizbowl/constants.js';

import { Router } from 'express';

const router = Router();

/**
 * Validate the parameters for the frequency list API endpoint.
 * If a `category`, `subcategory`, and/or `alternateSubcategory` are provided, the frequency list will filter over questions that match all provided fields.
 * If neither `category` nor `subcategory` nor `alternateSubcategory` are provided, an empty array will be returned.
 * @param {object} params
 * @param {string} [params.alternateSubcategory] - The alternate subcategory to get the frequency list for, if any.
 * @param {string} [params.category] - The category to get the frequency list for, if any.
 * @param {string} [params.subcategory] - The subcategory to get the frequency list for, if any.
 * @param {number[] | string[] | number | string} [params.difficulties] - The difficulty levels to include in the frequency list. Can be an array of numbers or a comma-separated string of numbers. Default is all difficulties.
 * @param {number | string} [params.limit=50] - The maximum number of answers to return. Must be a number or a string representation of a number. Default is 50.
 * @param {'tossup' | 'bonus' | 'all'} [params.questionType] - The type of question to include. Default is 'all'.
 * @returns {{
 *  alternateSubcategory: string | undefined,
 *  category: string | undefined,
 *  difficulties: number[],
 *  limit: number,
 *  questionType: 'tossup' | 'bonus' | 'all',
 *  subcategory: string | undefined
 *  } | null} The validated parameters, or `null` if the parameters are invalid.
 */
function validateParams ({ alternateSubcategory, category, subcategory, difficulties = DIFFICULTIES, limit = 50, questionType = 'all' }) {
  if (typeof alternateSubcategory !== 'string' && alternateSubcategory !== undefined) {
    return null;
  }

  if (typeof category !== 'string' && category !== undefined) {
    return null;
  }

  limit = parseInt(limit);
  if (isNaN(limit) || limit < 1) {
    return null;
  }

  if (typeof difficulties === 'string') { difficulties = difficulties.split(','); }
  if (!Array.isArray(difficulties)) { difficulties = [difficulties]; }
  difficulties = difficulties.map(difficulty => parseInt(difficulty));
  if (!Array.isArray(difficulties) || difficulties.some(difficulty => isNaN(difficulty) || difficulty < 0 || difficulty > 10)) {
    return null;
  }

  if (!['tossup', 'bonus', 'all'].includes(questionType)) {
    return null;
  }

  if (typeof subcategory !== 'string' && subcategory !== undefined) {
    return null;
  }

  return { alternateSubcategory, category, difficulties, limit, questionType, subcategory };
}

router.use('/', async (req, res) => {
  const params = validateParams(req.query);
  if (params === null) {
    return res.status(400).send('Invalid parameters');
  }

  const frequencyList = await getFrequencyList(params);
  res.json({ frequencyList });
});

export default router;
