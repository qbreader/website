import { bonuses, tossups } from './collections.js';

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Extracts pronunciation guides for a word from a question string.
 * Pronunciation guides in the original question text use Unicode curly quotes.
 * @param {string} question
 * @param {string} word
 * @returns {string[]} Array of pronunciation guide strings (the text inside the curly quotes)
 */
function extractPronunciationGuides (question, word) {
  const pgRegex = new RegExp(
    escapeRegExp(word) + '\\s*\\(\u201C([^\u201C-\u201F]*)\u201D\\)',
    'gi'
  );
  const guides = [];
  let match;
  while ((match = pgRegex.exec(question)) !== null) {
    guides.push(match[1]);
  }
  return guides;
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
  if (!word || typeof word !== 'string') {
    return { tossups: [], bonuses: [] };
  }

  word = word.trim();
  if (word === '') {
    return { tossups: [], bonuses: [] };
  }

  limit = parseInt(limit);
  if (!Number.isInteger(limit) || limit <= 0) {
    limit = 50;
  }
  limit = Math.min(limit, 200);

  // In the sanitized fields, curly quotes are normalized to regular ASCII double quotes.
  // The 'i' (case-insensitive) flag is applied in the MongoDB query options below.
  const escapedWord = escapeRegExp(word);
  const sanitizedRegex = `${escapedWord}\\s*\\("[^"]*"\\)`;

  const projection = {
    _id: 1,
    question: 1,
    answer: 1,
    'set.name': 1,
    'set.year': 1,
    'packet.number': 1,
    number: 1,
    category: 1,
    subcategory: 1,
    difficulty: 1
  };

  const [tossupResults, bonusResults] = await Promise.all([
    tossups.find(
      { question_sanitized: { $regex: sanitizedRegex, $options: 'i' } },
      { projection, sort: { 'set.name': -1, 'packet.number': 1, number: 1 }, limit }
    ).toArray(),
    bonuses.find(
      {
        $or: [
          { leadin_sanitized: { $regex: sanitizedRegex, $options: 'i' } },
          { parts_sanitized: { $regex: sanitizedRegex, $options: 'i' } }
        ]
      },
      {
        projection: {
          _id: 1,
          leadin: 1,
          parts: 1,
          answers: 1,
          'set.name': 1,
          'set.year': 1,
          'packet.number': 1,
          number: 1,
          category: 1,
          subcategory: 1,
          difficulty: 1
        },
        sort: { 'set.name': -1, 'packet.number': 1, number: 1 },
        limit
      }
    ).toArray()
  ]);

  // Annotate each tossup result with extracted pronunciation guides
  const tossups_ = tossupResults.map(tossup => {
    const pronunciationGuides = extractPronunciationGuides(tossup.question, word);
    return { ...tossup, pronunciationGuides };
  });

  // Annotate each bonus result with extracted pronunciation guides
  const bonuses_ = bonusResults.map(bonus => {
    const allText = [bonus.leadin, ...(bonus.parts ?? [])].join(' ');
    const pronunciationGuides = extractPronunciationGuides(allText, word);
    return { ...bonus, pronunciationGuides };
  });

  return { tossups: tossups_, bonuses: bonuses_ };
}
