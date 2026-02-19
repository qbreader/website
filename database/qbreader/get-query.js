import { bonuses, tossups } from './collections.js';

import { OKCYAN, ENDC, OKGREEN } from '../../server/bcolors.js';
import { DEFAULT_QUERY_RETURN_LENGTH, MAX_QUERY_RETURN_LENGTH } from '../../constants.js';
// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
function escapeRegExp (string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function unformatString (string) {
  return string
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018-\u201B]/g, '\'')
    .replace(/[\u201C-\u201F]/g, '"')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2032-\u2037]/g, '\'')
    .replace(/[\u00B7\u22C5\u2027]/g, '') // interpuncts
    .replace(/\u0142/g, 'l'); // ł -> l
}

function getQuerySummary (options) {
  const { queryString, difficulties, maxReturnLength, questionType, randomize, regex, searchType, setName } = options;

  return `\
    [DATABASE] QUERY: string: ${OKCYAN}${queryString}${ENDC}; \
    difficulties: ${OKGREEN}${difficulties}${ENDC}; \
    max length: ${OKGREEN}${maxReturnLength}${ENDC}; \
    question type: ${OKGREEN}${questionType}${ENDC}; \
    randomize: ${OKGREEN}${randomize}${ENDC}; \
    regex: ${OKGREEN}${regex}${ENDC}; \
    search type: ${OKGREEN}${searchType}${ENDC}; \
    set name: ${OKGREEN}${setName}${ENDC}; \
    `;
}

function validateOptions ({
  queryString,
  difficulties,
  setName,
  searchType = 'all',
  questionType = 'all',
  categories,
  subcategories,
  alternateSubcategories,
  maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH,
  randomize = false,
  regex = false,
  ignoreWordOrder = false,
  exactPhrase = false,
  caseSensitive = false,
  powermarkOnly = false,
  tossupPagination = 1,
  bonusPagination = 1,
  minYear,
  maxYear,
  verbose = false
}) {
  let words;

  maxReturnLength = Math.min(maxReturnLength, MAX_QUERY_RETURN_LENGTH);

  if (maxReturnLength <= 0) {
    maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;
  }

  if (!queryString) {
    queryString = '';
  }

  if (!questionType) {
    questionType = 'all';
  } else if (!['tossup', 'bonus', 'all'].includes(questionType)) {
    throw new Error('Invalid question type specified.');
  }

  if (regex) {
    exactPhrase = false;
    ignoreWordOrder = false;
  } else {
    queryString = queryString.trim();
    queryString = unformatString(queryString);
    queryString = escapeRegExp(queryString);
  }

  if (ignoreWordOrder) {
    words = queryString.split(' ').filter(word => word !== '');
  } else {
    words = [queryString];
  }

  if (exactPhrase && !regex) {
    queryString = `\\b${queryString}\\b`;
    words = words.map(word => `\\b${word}\\b`);
  }

  if (!searchType) {
    searchType = 'all';
  } else if (!['question', 'answer', 'all'].includes(searchType)) {
    throw new Error('Invalid search type specified.');
  }

  if (alternateSubcategories) {
    alternateSubcategories = alternateSubcategories.concat([null]);
  }

  return { queryString, difficulties, setName, searchType, questionType, categories, subcategories, alternateSubcategories, maxReturnLength, randomize, regex, exactPhrase, caseSensitive, powermarkOnly, tossupPagination, bonusPagination, minYear, maxYear, verbose, words };
}

/**
 * Retrieves questions from the database based on a search query.
 * Also validates option _values_ and sets _default values_, but does not validate option _types_.
 * @param {object} options - The options for the question retrieval.
 * @param {string} options.queryString - The search query string.
 * @param {number[]} options.difficulties - An array of difficulties to filter by.
 * @param {string} options.setName - The name of the set to search in.
 * @param {'question' | 'answer' | 'all'} [options.searchType='all'] - The type of search to perform.
 * @param {'tossup' | 'bonus' | 'all'} [options.questionType='all'] - The type of question to search for.
 * @param {string[]} [options.categories] - An array of categories to filter by.
 * @param {string[]} [options.subcategories] - An array of subcategories to filter by.
 * @param {string[]} [options.alternateSubcategories] - An array of alternate subcategories to filter by.
 * @param {number} [options.maxReturnLength] - The maximum number of questions to return.
 * @param {boolean} [options.randomize=false] - Whether to randomize the order of the returned questions.
 * @param {boolean} [options.regex=false] - Whether to treat the search query as a regular expression.
 * @param {boolean} [options.ignoreWordOrder=false] - Whether to ignore the word order in the search query. This allows the words to appear anywhere in the text, not necessarily next to each other.
 * @param {boolean} [options.exactPhrase=false] - Whether to search for an exact phrase match.
 * @param {boolean} [options.powermarkOnly=false] - Whether to only search for powermarked questions.
 * @param {number} [options.tossupPagination=1] - The page number of the tossup pagination.
 * @returns {Promise<{tossups: {count: Number, questionArray: types.Tossup[]}, bonuses: {count: Number, questionArray: types.Bonus[]}}>} The retrieved questions.
 */
async function getQuery (options = {}) {
  if (options.verbose) {
    console.time('getQuery');
  }

  // throws error if invalid options
  options = validateOptions(options);

  let tossupQuery = null;
  if (['tossup', 'all'].includes(options.questionType)) {
    tossupQuery = getTossupQuery(options);
  }

  let bonusQuery = null;
  if (['bonus', 'all'].includes(options.questionType)) {
    bonusQuery = getBonusQuery(options);
  }

  // fetching both tossup and bonus queries in parallel is twice as fast as fetching them sequentially
  const values = await Promise.all([tossupQuery, bonusQuery]);

  const returnValue = {
    tossups: values[0] ?? { count: 0, questionArray: [] },
    bonuses: values[1] ?? { count: 0, questionArray: [] },
    queryString: options.queryString
  };

  if (options.verbose) {
    console.log(getQuerySummary(options));
    console.timeEnd('getQuery');
  }

  return returnValue;
}

async function getTossupQuery (options) {
  const { caseSensitive, maxReturnLength, searchType, tossupPagination, words } = options;

  const andQuery = [];
  for (const word of words) {
    const orQuery = [];

    if (['question', 'all'].includes(searchType)) {
      orQuery.push({ question_sanitized: { $regex: word, $options: caseSensitive ? '' : 'i' } });
    }

    if (['answer', 'all'].includes(searchType)) {
      orQuery.push({ answer_sanitized: { $regex: word, $options: caseSensitive ? '' : 'i' } });
    }

    andQuery.push({ $or: orQuery });
  }

  if (options.queryString === '') {
    options.query = {};
  } else {
    options.query = {
      $and: andQuery
    };
  }

  const { aggregation, query } = buildQueryAggregation(options);

  try {
    const [questionArray, count] = await Promise.all([
      tossups.aggregate(aggregation).skip((tossupPagination - 1) * maxReturnLength).limit(maxReturnLength).toArray(),
      tossups.countDocuments(query)
    ]);
    return { count, questionArray };
  } catch (MongoServerError) {
    console.log(MongoServerError);
    return { count: 0, questionArray: [] };
  }
}

async function getBonusQuery (options) {
  const { bonusPagination, caseSensitive, maxReturnLength, searchType, words } = options;

  const andQuery = [];
  for (const word of words) {
    const orQuery = [];

    if (['question', 'all'].includes(searchType)) {
      orQuery.push({ leadin_sanitized: { $regex: word, $options: caseSensitive ? '' : 'i' } });
      orQuery.push({ parts_sanitized: { $regex: word, $options: caseSensitive ? '' : 'i' } });
    }

    if (['answer', 'all'].includes(searchType)) {
      orQuery.push({ answers_sanitized: { $regex: word, $options: caseSensitive ? '' : 'i' } });
    }

    andQuery.push({ $or: orQuery });
  }

  if (options.queryString === '') {
    options.query = {};
  } else {
    options.query = {
      $and: andQuery
    };
  }

  const { aggregation, query } = buildQueryAggregation(options);

  try {
    const [questionArray, count] = await Promise.all([
      bonuses.aggregate(aggregation).skip((bonusPagination - 1) * maxReturnLength).limit(maxReturnLength).toArray(),
      bonuses.countDocuments(query)
    ]);
    return { count, questionArray };
  } catch (MongoServerError) {
    console.log(MongoServerError);
    return { count: 0, questionArray: [] };
  }
}

function buildQueryAggregation ({ query, difficulties, categories, subcategories, alternateSubcategories, setName, maxReturnLength, randomize, minYear, maxYear, isEmpty, powermarkOnly }) {
  if (isEmpty) {
    delete query.$or;
  }

  if (difficulties) {
    query.difficulty = { $in: difficulties };
  }

  if (categories) {
    query.category = { $in: categories };
  }

  if (subcategories) {
    query.subcategory = { $in: subcategories };
  }

  if (alternateSubcategories) {
    query.alternate_subcategory = { $in: alternateSubcategories };
  }

  if (setName) {
    // setName is now an array after being split by commas
    if (Array.isArray(setName)) {
      if (setName.length === 1) {
        // Single set name - use regex for partial matching
        query['set.name'] = { $regex: setName[0], $options: 'i' };
      } else {
        // Multiple set names - use $or with $regex for each pattern
        const setNameOr = setName.map(name => ({
          'set.name': { $regex: name, $options: 'i' }
        }));

        // Always add to $and array to properly combine with other conditions
        if (query.$and) {
          query.$and.push({ $or: setNameOr });
        } else {
          // Create $and array with the $or condition
          // Note: Other conditions (difficulty, category, etc.) are direct properties
          // and will be ANDed with this $and at the top level by MongoDB
          query.$and = [{ $or: setNameOr }];
        }
      }
    } else {
      // Backward compatibility: if setName is a string (shouldn't happen after API route change)
      query['set.name'] = { $regex: setName, $options: 'i' };
    }
  }

  if (minYear && maxYear) {
    query['set.year'] = { $gte: minYear, $lte: maxYear };
  } else if (minYear) { query['set.year'] = { $gte: minYear }; } else if (maxYear) {
    query['set.year'] = { $lte: maxYear };
  }

  if (powermarkOnly) {
    query.question_sanitized = { $regex: '\\(\\*\\)' };
  }

  const aggregation = [
    { $match: query },
    {
      $sort: {
        'set.name': -1,
        'packet.number': 1,
        number: 1
      }
    },
    // { $skip: (pagination - 1) * maxReturnLength },
    // { $limit: maxReturnLength },
    { $project: { reports: 0 } }
  ];

  if (randomize) {
    aggregation[1] = { $sample: { size: maxReturnLength } };
  }

  return { aggregation, query };
}

export default getQuery;
