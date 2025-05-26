import { bonuses, packets, tossups } from './collections.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Modaqifies a tossup without modifying the original tossup.
 * @param {types.Tossup} tossup - The tossup to modaqify.
 * @returns The modaqified tossup.
 */
function modaqifyTossup (tossup) {
  const result = {
    question: tossup.question.replace('<i>', '<em>').replace('</i>', '</em>'),
    answer: tossup.answer.replace('<i>', '<em>').replace('</i>', '</em>'),
    metadata: `${tossup.category} - ${tossup.subcategory}` + tossup.alternate_subcategory ? ` - ${tossup.alternate_subcategory}` : ''
  };

  return result;
}

/**
 *
 * @param {types.Bonus} bonus
 * @returns
 */
function modaqifyBonus (bonus) {
  const result = {
    values: bonus.values ?? bonus.parts.map(() => 10),
    leadin: bonus.leadin.replace('<i>', '<em>').replace('</i>', '</em>'),
    parts: bonus.parts.map(part => part.replace('<i>', '<em>').replace('</i>', '</em>')),
    answers: bonus.answers.map(answer => answer.replace('<i>', '<em>').replace('</i>', '</em>')),
    metadata: `${bonus.category} - ${bonus.subcategory}` + bonus.alternate_subcategory ? ` - ${bonus.alternate_subcategory}` : ''
  };

  if (bonus.difficultyModifiers) {
    result.difficultyModifiers = bonus.difficultyModifiers;
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
 * @param {boolean} [options.modaq=false] - Whether to output in a result compatible with MODAQ.
 * @returns {Promise<{tossups: types.Tossup[], bonuses: types.Bonus[]}>} The retrieved packet of questions.
 */
async function getPacket ({ _id, setName, packetNumber, questionTypes = ['tossups', 'bonuses'], modaq = false }) {
  if (!_id && (!setName || isNaN(packetNumber) || packetNumber < 1)) {
    return { tossups: [], bonuses: [] };
  }

  const packet = _id
    ? await packets.findOne({ _id })
    : await packets.findOne({ 'set.name': setName, number: packetNumber });

  if (!packet) {
    return { tossups: [], bonuses: [] };
  }

  const tossupResult = questionTypes.includes('tossups')
    ? tossups.find({ 'packet._id': packet._id }, {
      sort: { number: 1 },
      project: { reports: 0 }
    }).toArray()
    : null;

  const bonusResult = questionTypes.includes('bonuses')
    ? bonuses.find({ 'packet._id': packet._id }, {
      sort: { number: 1 },
      project: { reports: 0 }
    }).toArray()
    : null;

  const values = await Promise.all([tossupResult, bonusResult]);

  const result = {
    tossups: [],
    bonuses: [],
    packet
  };

  if (questionTypes.includes('tossups')) {
    result.tossups = values[0];
  }

  if (questionTypes.includes('bonuses')) {
    result.bonuses = values[1];
  }

  if (modaq) {
    result.tossups = result.tossups.map(tossup => modaqifyTossup(tossup));
    result.bonuses = result.bonuses.map(bonus => modaqifyBonus(bonus));
  }

  return result;
}

export default getPacket;
