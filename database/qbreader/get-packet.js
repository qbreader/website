import { bonuses, packets, tossups } from './collections.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Modaqifies a tossup without modifying the original tossup.
 * @param {types.Tossup} tossup - The tossup to modaqify.
 * @returns The modaqified tossup.
 */
function modaqifyTossup(tossup) {
    const result = {
        question: tossup.question,
        answer: tossup.answer,
        metadata: `${tossup.category} - ${tossup.subcategory}`,
    };

    if (tossup?.question && tossup.question.includes('(*)')) {
        result.question = '<b>' + tossup.question.replace('(*)', '(*)</b>');
    }

    if (tossup.formatted_answer) {
        result.answer = tossup.formatted_answer.replace('<i>', '<em>').replace('</i>', '</em>');
    }

    return result;
}


function modaqifyBonus(bonus) {
    const result = {
        values: bonus.values ?? bonus.parts.map(() => 10),
        leadin: bonus.leadin,
        parts: bonus.parts,
        answers: bonus.answers,
        metadata: `${bonus.category} - ${bonus.subcategory}`,
    };

    if (bonus.difficulties) {
        result.difficultyModifiers = bonus.difficulties;
    }

    if (bonus.formatted_answers) {
        result.answers = bonus.formatted_answers.map(answer => answer.replace('<i>', '<em>').replace('</i>', '</em>'));
    }

    return result;
}

/**
 * Retrieves a packet of questions from the database.
 * @param {object} options - The options for the packet retrieval.
 * @param {string} options.setName - The name of the set (e.g. "2021 ACF Fall").
 * @param {number} options.packetNumber - **one-indexed** packet number.
 * @param {Array<String>} [options.questionTypes=['tossups', 'bonuses']] - The types of questions to retrieve.
 * If only one allowed type is specified, only that type will be searched for (increasing query speed).
 * The other type will be returned as an empty array.
 * @param {boolean} [options.replaceUnformattedAnswer=true] - Whether to replace unformatted answers.
 * @param {boolean} [options.modaq=false] - Whether to output in a result compatible with MODAQ.
 * @returns {Promise<{tossups: types.Tossup[], bonuses: types.Bonus[]}>} The retrieved packet of questions.
 */
async function getPacket({ setName, packetNumber, questionTypes = ['tossups', 'bonuses'], replaceUnformattedAnswer = true, modaq = false }) {
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
            sort: { number: 1 },
            project: { reports: 0 },
        }).toArray()
        : null;

    const bonusResult  = questionTypes.includes('bonuses')
        ? bonuses.find({ 'packet._id': packet._id }, {
            sort: { number: 1 },
            project: { reports: 0 },
        }).toArray() : null;

    const values = await Promise.all([tossupResult, bonusResult]);

    const result = {
        tossups: [],
        bonuses: [],
    };

    if (questionTypes.includes('tossups')) {
        result.tossups = values[0];
    }

    if (questionTypes.includes('bonuses')) {
        result.bonuses = values[1];
    }

    if (replaceUnformattedAnswer && !modaq) {
        for (const tossup of result.tossups) {
            if (Object.prototype.hasOwnProperty.call(tossup, 'formatted_answer'))
                tossup.answer = tossup.formatted_answer;
        }

        for (const bonus of result.bonuses) {
            if (Object.prototype.hasOwnProperty.call(bonus, 'formatted_answers'))
                bonus.answers = bonus.formatted_answers;
        }
    }

    if (modaq) {
        result.tossups = result.tossups.map(tossup => modaqifyTossup(tossup));
        result.bonuses = result.bonuses.map(bonus => modaqifyBonus(bonus));
    }

    return result;
}

export default getPacket;
