import getSetId from '../../qbreader/get-set-id.js';

/**
 * Generates a match document for a given user and set of match options.
 * @param {Object} query - The options for the match generation.
 * @param {ObjectId} query.userId - The ID of the user generating the match.
 * @param {number[]} query.difficulties - An array of difficulties to filter by.
 * @param {string} query.setName - The name of the set to search in.
 * @param {boolean} query.includeMultiplayer - Whether to include multiplayer questions.
 * @param {boolean} query.includeSingleplayer - Whether to include singleplayer questions.
 * @param {Date} [query.startDate] - The start date of the match.
 * @param {Date} [query.endDate] - The end date of the match.
 * @returns {Promise<Object>} The generated match document.
 */
export default async function generateMatchDocument ({ userId, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const matchDocument = { 'data.user_id': userId };

  if (!includeMultiplayer && !includeSingleplayer) {
    return { _id: null };
  }

  if (!includeSingleplayer) {
    matchDocument['data.multiplayer'] = true;
  }

  if (!includeMultiplayer) {
    // if multiplayer field is missing, then it is singleplayer
    matchDocument['data.multiplayer'] = false;
  }

  if (difficulties) {
    matchDocument.difficulty = { $in: difficulties };
  }

  if (setName) {
    matchDocument.set_id = await getSetId(setName);
  }

  if (startDate) {
    matchDocument['data.created'] = { $gte: startDate };
  }

  if (endDate) {
    if (!matchDocument['data.created']) {
      matchDocument['data.created'] = {};
    }

    matchDocument['data.created'].$lt = new Date(endDate.getTime() + 1000 * 60 * 60 * 24);
  }

  return matchDocument;
}
