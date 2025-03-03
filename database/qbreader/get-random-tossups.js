import { tossups } from './collections.js';

import { CATEGORIES, SUBCATEGORIES } from '../../quizbowl/categories.js';
import { DIFFICULTIES, DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR } from '../../quizbowl/constants.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Get an array of random tossups. This method is 3-4x faster than using the randomize option in getQuery.
 * @param {Object} object - an object containing the parameters
 * @param {number[]} [object.difficulties] - an array of allowed difficulty levels (1-10). Pass a 0-length array, null, or undefined to select any difficulty.
 * @param {string[]} [object.categories] - an array of allowed categories. Pass a 0-length array, null, or undefined to select any category.
 * @param {string[]} [object.subcategories] - an array of allowed subcategories. Pass a 0-length array, null, or undefined to select any subcategory.
 * @param {string[]} [object.alternateSubcategories] - an array of allowed alternate subcategories. Pass a 0-length array, null, or undefined to select any alternate subcategory.
 * @param {number} [object.number=1] - how many random tossups to return. Default: 1.
 * @param {number} [object.minYear] - the minimum year to select from. Default: `DEFAULT_MIN_YEAR`.
 * @param {number} [object.maxYear] - the maximum year to select from. Default: `DEFAULT_MAX_YEAR`.
 * @param {boolean} [object.powermarkOnly=false]
 * @param {boolean} [object.standardOnly=false]
 * @returns {Promise<types.Tossup[]>}
 */
async function getRandomTossups ({
  difficulties = DIFFICULTIES,
  categories = CATEGORIES,
  subcategories = SUBCATEGORIES,
  alternateSubcategories = [],
  number = 1,
  minYear = DEFAULT_MIN_YEAR,
  maxYear = DEFAULT_MAX_YEAR,
  powermarkOnly = false,
  standardOnly = false
} = {}) {
  const aggregation = [
    { $match: { 'set.year': { $gte: minYear, $lte: maxYear } } },
    { $sample: { size: number } },
    { $project: { reports: 0 } }
  ];

  if (difficulties?.length) {
    aggregation[0].$match.difficulty = { $in: difficulties };
  }

  if (alternateSubcategories?.length) {
    aggregation[0].$match.alternate_subcategory = { $in: alternateSubcategories.concat([null]) };
  }

  if (categories?.length) {
    aggregation[0].$match.category = { $in: categories };
  }

  if (subcategories?.length) {
    aggregation[0].$match.subcategory = { $in: subcategories };
  }

  if (powermarkOnly) {
    aggregation[0].$match.question = { $regex: '\\(\\*\\)' };
  }

  if (standardOnly) {
    aggregation[0].$match['set.standard'] = true;
  }

  return await tossups.aggregate(aggregation).toArray();
}

export default getRandomTossups;
