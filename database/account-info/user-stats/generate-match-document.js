import getSetId from '../../qbreader/get-set-id.js';

/**
 * Generates a match document for a given user and set of match options.
 * @param {Object} options - The options for the match generation.
 * @param {string} options.userId - The ID of the user generating the match.
 * @param {number[]} options.difficulties - An array of difficulties to filter by.
 * @param {string} options.setName - The name of the set to search in.
 * @param {boolean} options.includeMultiplayer - Whether to include multiplayer questions.
 * @param {boolean} options.includeSingleplayer - Whether to include singleplayer questions.
 * @param {Date} [options.startDate] - The start date of the match.
 * @param {Date} [options.endDate] - The end date of the match.
 * @returns {Object} The generated match document.
 */
async function generateMatchDocument ({ userId, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
  const matchDocument = { user_id: userId };

  if (!includeMultiplayer && !includeSingleplayer) {
    return { _id: null };
  }

  if (!includeSingleplayer) {
    matchDocument.multiplayer = true;
  }

  if (!includeMultiplayer) {
    // if multiplayer field is missing, then it is singleplayer
    matchDocument.multiplayer = { $ne: true };
  }

  if (difficulties) {
    matchDocument.difficulty = { $in: difficulties };
  }

  if (setName) {
    matchDocument.set_id = await getSetId(setName);
  }

  if (startDate) {
    matchDocument.createdAt = { $gte: startDate };
  }

  if (endDate) {
    if (!matchDocument.createdAt) {
      matchDocument.createdAt = {};
    }

    matchDocument.createdAt.$lt = new Date(endDate.getTime() + 1000 * 60 * 60 * 24);
  }

  return matchDocument;
}

export default generateMatchDocument;
