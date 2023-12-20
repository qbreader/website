import { bonuses, packets, tossups } from './collections.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Retrieves a packet of questions from the database.
 * @param {object} options - The options for the packet retrieval.
 * @param {string} options.setName - The name of the set (e.g. "2021 ACF Fall").
 * @param {number} options.packetNumber - **one-indexed** packet number.
 * @param {Array<String>} [options.questionTypes=['tossups', 'bonuses']] - The types of questions to retrieve.
 * If only one allowed type is specified, only that type will be searched for (increasing query speed).
 * The other type will be returned as an empty array.
 * @param {boolean} [options.replaceUnformattedAnswer=true] - Whether to replace unformatted answers.
 * @returns {Promise<{tossups: types.Tossup[], bonuses: types.Bonus[]}>} The retrieved packet of questions.
 */
async function getPacket({ setName, packetNumber, questionTypes = ['tossups', 'bonuses'], replaceUnformattedAnswer = true }) {
    if (!setName || isNaN(packetNumber) || packetNumber < 1) {
        return { 'tossups': [], 'bonuses': [] };
    }

    const packet = await packets.findOne({ 'set.name': setName, number: packetNumber });

    if (!packet) {
        console.log(`[DATABASE] WARNING: set "${setName}" does not exist`);
        return { 'tossups': [], 'bonuses': [] };
    }

    const tossupResult = questionTypes.includes('tossups')
        ? tossups.find({ 'packet._id': packet._id }, {
            sort: { questionNumber: 1 },
            project: { reports: 0 },
        }).toArray()
        : null;

    const bonusResult  = questionTypes.includes('bonuses')
        ? bonuses.find({ 'packet._id': packet._id }, {
            sort: { questionNumber: 1 },
            project: { reports: 0 },
        }).toArray() : null;

    const values = await Promise.all([tossupResult, bonusResult]);

    const result = {};

    if (questionTypes.includes('tossups'))
        result.tossups = values[0];

    if (questionTypes.includes('bonuses'))
        result.bonuses = values[1];

    if (replaceUnformattedAnswer) {
        for (const question of result.tossups || []) {
            if (Object.prototype.hasOwnProperty.call(question, 'formatted_answer'))
                question.answer = question.formatted_answer;
        }

        for (const question of result.bonuses || []) {
            if (Object.prototype.hasOwnProperty.call(question, 'formatted_answers'))
                question.answers = question.formatted_answers;
        }
    }

    return result;
}

export default getPacket;
