import { bonuses, tossups } from './collections.js';

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Look up pronunciation guides for a given word or phrase.
 * Searches both tossup and bonus question text for instances of the word
 * followed by a pronunciation guide in the format: word ("pronunciation").
 * @param {object} options
 * @param {string} options.word - The word or phrase to look up.
 * @param {number} [options.limit=50] - Maximum number of results to return per question type.
 * @returns {Promise<{tossups: object[], bonuses: object[]}>}
 */
export default async function getPgLookup ({ word, limit = 50 }) {
  if (word === '') { return { tossups: [], bonuses: [] }; }

  const escapedWord = escapeRegExp(word);
  const sanitizedRegex = `\\b${escapedWord}\\s*\\("([^"]*)"\\)`;

  function extractPronunciationGuide (text) {
    // exclude g tag to get capturing groups
    const match = text.match(new RegExp(sanitizedRegex, 'i'));
    return match?.at(1) ?? null;
  }

  limit = Math.min(limit, 200);

  const [tossupResults, bonusResults] = await Promise.all([
    tossups.find(
      { question_sanitized: { $regex: sanitizedRegex, $options: 'i' } },
      { sort: { 'set.name': -1, 'packet.number': 1, number: 1 }, limit }
    ).toArray(),
    bonuses.find(
      {
        $or: [
          { leadin_sanitized: { $regex: sanitizedRegex, $options: 'i' } },
          { parts_sanitized: { $regex: sanitizedRegex, $options: 'i' } }
        ]
      },
      { sort: { 'set.name': -1, 'packet.number': 1, number: 1 }, limit }
    ).toArray()
  ]);

  const tossups_ = tossupResults.map(tossup => {
    const pg = extractPronunciationGuide(tossup.question_sanitized);
    return { ...tossup, pg };
  });

  const bonuses_ = bonusResults.map(bonus => {
    const allText = [bonus.leadin_sanitized, ...(bonus.parts_sanitized ?? [])].join(' ');
    const pg = extractPronunciationGuide(allText);
    return { ...bonus, pg };
  });

  return { tossups: tossups_, bonuses: bonuses_ };
}
