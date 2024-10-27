import { tossups, bonuses } from './collections.js';

import { CATEGORIES, SUBCATEGORIES } from '../../quizbowl/categories.js';
// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Gets all questions in a set that satisfy the given parameters.
 * @param object - an object containing the parameters
 * @param {string} object.setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {number[]} object.packetNumbers - an array of packet numbers to search. Each packet number is 1-indexed.
 * @param {string[]} object.categories
 * @param {string[]} object.subcategories
 * @param {'tossup' | 'bonus'} [object.questionType='tossup'] - Type of question you want to get. Default: `'tossup'`.
 * @param {boolean} object.reverse - whether to reverse the order of the questions in the array. Useful for functions that pop at the end of the array, Default: `false`
 * @returns {Promise<types.Tossup[] | types.Bonus[]>}
 */
async function getSet ({ setName, packetNumbers, categories, subcategories, questionType = 'tossup', reverse = false }) {
  if (!setName) return [];

  if (!categories || categories.length === 0) categories = CATEGORIES;
  if (!subcategories || subcategories.length === 0) subcategories = SUBCATEGORIES;
  if (!questionType) questionType = 'tossup';

  const filter = {
    'set.name': setName,
    category: { $in: categories },
    subcategory: { $in: subcategories },
    'packet.number': { $in: packetNumbers }
  };

  const options = {
    sort: { 'packet.number': reverse ? -1 : 1, number: reverse ? -1 : 1 },
    project: { reports: 0 }
  };

  if (questionType === 'tossup') {
    const questionArray = await tossups.find(filter, options).toArray();
    return questionArray || [];
  } else if (questionType === 'bonus') {
    const questionArray = await bonuses.find(filter, options).toArray();
    return questionArray || [];
  }
}

export default getSet;
