import { bonuses, tossups } from './collections.js';
import mergeTwoSortedArrays from '../../server/merge-two-sorted-arrays.js';

/**
 * Get a frequency list of answers for a given category/subcategory/alternateSubcategory, and difficulty.
 * If neither `category` nor `subcategory` nor `alternateSubcategory` are provided, an empty array will be returned.
 * If a `category`, `subcategory`, and/or `alternateSubcategory` are provided, the frequency list will filter over questions that match all provided fields.
 * @param {object} params
 * @param {string} params.subcategory The subcategory to get the frequency list for.
 * @param {string} params.alternateSubcategory The alternate subcategory to get the frequency list for.
 * @param {number[]} [params.difficulties] An array of difficulties to include.
 * @param {number} [params.limit=50] The maximum number of answers to return.
 * @param {'tossup' | 'bonus' | 'all'} [params.questionType] The type of question to include.
 * @returns {Promise<{ answer: string, count: number }[]>} The frequency list.
 */
export default async function getFrequencyList ({ alternateSubcategory, category, subcategory, difficulties, limit, questionType }) {
  if (!category && !subcategory && !alternateSubcategory) { return []; }

  const matchDocument = { difficulty: { $in: difficulties } };
  if (category) { matchDocument.category = category; }
  if (subcategory) { matchDocument.subcategory = subcategory; }
  if (alternateSubcategory) { matchDocument.alternate_subcategory = alternateSubcategory; }

  const tossupAggregation = [
    { $match: matchDocument },
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
    { $addFields: { answer_normalized: { $trim: { input: '$regex.match' } } } },
    {
      $addFields: {
        // Replace hyphens with spaces to treat them as equivalent
        answer_normalized: { $replaceAll: { input: '$answer_normalized', find: '-', replacement: ' ' } }
      }
    },
    { $group: { _id: '$answer_normalized', count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
    { $addFields: { answer: '$_id' } },
    { $sort: { answer: 1 } }
  ];

  const bonusAggregation = [
    { $unwind: { path: '$answers_sanitized' } },
    { $addFields: { answer_sanitized: '$answers_sanitized' } }
  ].concat(tossupAggregation);

  switch (questionType) {
    case 'tossup': {
      const tossupList = await tossups.aggregate(tossupAggregation).toArray();
      tossupList.sort((a, b) => b.count - a.count);
      if (limit) { tossupList.length = Math.min(limit, tossupList.length); }
      return tossupList;
    }
    case 'bonus': {
      const bonusList = await bonuses.aggregate(bonusAggregation).toArray();
      bonusList.sort((a, b) => b.count - a.count);
      if (limit) { bonusList.length = Math.min(limit, bonusList.length); }
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
    (a) => a.answer,
    (a, b) => ({ answer: a.answer, count: a.count + b.count })
  );

  frequencyList.sort((a, b) => b.count - a.count);

  if (limit) {
    frequencyList.length = Math.min(limit, frequencyList.length);
  }

  return frequencyList;
}
