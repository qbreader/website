import { bonuses, tossups } from './collections.js';
import { DIFFICULTIES } from '../../quizbowl/constants.js';
import mergeTwoSortedArrays from '../../server/merge-two-sorted-arrays.js';

/**
 * Get a frequency list of answers for a given subcategory and difficulty.
 * @param {string} subcategory
 * @param {number[]} [difficulties] An array of difficulties to include. Defaults to all difficulties.
 * @param {number} [limit=50] The maximum number of answers to return. Defaults to 50.
 * @returns {Promise<{ answer: string, count: number }[]>} The frequency list.
 */
async function getFrequencyList (subcategory, difficulties = DIFFICULTIES, limit = 50, questionType = 'all') {
  const tossupAggregation = [
    { $match: { subcategory, difficulty: { $in: difficulties } } },
    {
      $addFields: {
        // This is a regex that matches everything before the first open parenthesis or bracket.
        regex: { $regexFind: { input: '$answer_sanitized', regex: /^[^[(]*/ } }
      }
    },
    {
      $addFields: {
        // This is a regex that matches everything outside of parentheses ()
        regex: { $regexFind: { input: '$regex.match', regex: /[^()]+(?![^(]*\))/ } }
      }
    },
    {
      $addFields: {
        sanitized_answer: { $trim: { input: '$regex.match' } }
      }
    },
    { $group: { _id: '$sanitized_answer', count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
    { $addFields: { answer_sanitized: '$_id' } },
    { $sort: { answer_sanitized: 1 } }
  ];

  const bonusAggregation = [
    { $unwind: { path: '$answers_sanitized' } },
    { $addFields: { answer_sanitized: '$answers_sanitized' } }
  ].concat(tossupAggregation);

  switch (questionType) {
    case 'tossup': {
      const tossupList = await tossups.aggregate(tossupAggregation).toArray();
      tossupList.sort((a, b) => b.count - a.count);
      if (limit) {
        tossupList.length = limit;
      }
      return tossupList;
    }
    case 'bonus': {
      const bonusList = await bonuses.aggregate(bonusAggregation).toArray();
      bonusList.sort((a, b) => b.count - a.count);
      if (limit) {
        bonusList.length = limit;
      }
      return bonusList;
    }
    case 'all':
      break;
    default:
      throw new Error('Invalid question type');
  }

  const [tossupList, bonusList] = await Promise.all([
    tossups.aggregate(tossupAggregation).toArray(),
    bonuses.aggregate(bonusAggregation).toArray()
  ]);

  const frequencyList = mergeTwoSortedArrays(
    tossupList,
    bonusList,
    (a) => a.answer_sanitized,
    (a, b) => ({ answer_sanitized: a.answer_sanitized, count: a.count + b.count })
  );

  frequencyList.sort((a, b) => b.count - a.count);

  if (limit) {
    frequencyList.length = limit;
  }

  return frequencyList;
}

export default getFrequencyList;
