import { tossupData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';
import getUserId from '../get-user-id.js';

import getTossup from '../../qbreader/get-tossup.js';

/**
 * Generates a match document for a given set of match options.
 * @param {Object} options - The options for the match generation.
 * @param {string} options.user_id - The ID of the user generating the match.
 * @param {Array<Number>} options.difficulties - An array of difficulties to filter by.
 * @param {string} options.setName - The name of the set to search in.
 * @param {boolean} options.includeMultiplayer - Whether to include multiplayer questions.
 * @param {boolean} options.includeSingleplayer - Whether to include singleplayer questions.
 * @param {Date} [options.startDate] - The start date of the match.
 * @param {Date} [options.endDate] - The end date of the match.
 * @returns {Promise<Object>} The generated match document.
 */
async function getBestBuzz({ username, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }) {
    const user_id = await getUserId(username);
    const matchDocument = await generateMatchDocument({ user_id, difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
    matchDocument.isCorrect = true;

    const data = await tossupData.findOne(
        matchDocument,
        { sort: { celerity: -1 } },
    );

    if (!data)
        return null;

    data.tossup = await getTossup(data.tossup_id);
    return data;
}

export default getBestBuzz;
