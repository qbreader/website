import { perTossupData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';

import getTossup from '../../qbreader/get-tossup.js';

/**
 * Generates a match document for a given set of match options.
 * @param {ObjectId} userId - The _id of the user generating the match.
 * @param {Object} query - The options for the match generation.
 * @param {Array<Number>} query.difficulties - An array of difficulties to filter by.
 * @param {string} query.setName - The name of the set to search in.
 * @param {boolean} query.includeMultiplayer - Whether to include multiplayer questions.
 * @param {boolean} query.includeSingleplayer - Whether to include singleplayer questions.
 * @param {Date} [query.startDate] - The start date of the match.
 * @param {Date} [query.endDate] - The end date of the match.
 * @returns {Promise<Object>} The generated match document.
 */
export default async function getBestBuzz (userId, query) {
  const matchDocument = await generateMatchDocument({ userId, ...query });
  matchDocument['data.isCorrect'] = true;

  const data = (await perTossupData.aggregate([
    { $match: matchDocument },
    { $unwind: '$data' },
    { $match: { 'data.user_id': userId } },
    { $match: { 'data.user_id': { $ne: null } } },
    { $sort: { 'data.celerity': -1 } },
    { $limit: 1 }
  ]).toArray())[0];

  if (!data) { return null; }

  data.tossup = await getTossup(data._id);
  return {
    ...data.data,
    ...data
  };
}
