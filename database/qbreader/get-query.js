import { bonuses, tossups } from './collections.js';

import { OKCYAN, ENDC, OKGREEN } from '../../bcolors.js';
import { DEFAULT_QUERY_RETURN_LENGTH, MAX_QUERY_RETURN_LENGTH } from '../../constants.js';
// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


const regexIgnoreDiacritics = (() => {
    const baseCharacterGroups = [
        ['[aàáâǎäãåāăạả]'],
        ['[cçćčɔ́ĉƈ]'],
        ['[eèéêëēėęĕẹẻếềể]'],
        ['[iîïíīįìĩỉĭịỉ]'],
        ['[nñńŉňŋňņṅñ]'],
        ['[oôöòóøōõơồổỗộơớờở]'],
        ['[sśşšșṡŝ]'],
        ['[uûüùúūưũŭůųủǖǘǚ]'],
        ['[yÿŷýỳỷ]'],
        ['[zžźż]'],
    ];

    const extendedCharacterGroups = [
        ['[bḃḅ]'],
        ['[dďḋḍđδð]'],
        ['[fḟƒ]'],
        ['[gğģǧġĝǥ]'],
        ['[hḣĥħḫ"]'],
        ['[jĵȷǰ]'],
        ['[kķǩƙ]'],
        ['[lļľłĺļľł₺]'],
        ['[mṁṃ]'],
        ['[pṗ]'],
        ['[rŕřṙ]'],
        ['[tţťțṫŧťṯ]'],
        ['[wẇŵ]'],
        ['[xẋ]'],
    ].concat(baseCharacterGroups);

    const allCharacters = new RegExp('[' + extendedCharacterGroups.map(group => group[0].slice(1, -1)).join('') + ']', 'gi');
    const baseCharacters = new RegExp('[' + baseCharacterGroups.map(group => group[0].slice(1, -1)).join('') + ']', 'gi');

    return (string) => {
        const matchingCharacters = string.match(allCharacters)?.length ?? 0;
        if (matchingCharacters > 10) {
            if (string.length > matchingCharacters + 3) {
                return string.replace(baseCharacters, '.');
            } else {
                return string;
            }
        }

        for (const group of extendedCharacterGroups) {
            string = string.replace(new RegExp(group[0], 'gi'), group[0]);
        }
        return string;
    };
})();


/**
 * Retrieves questions from the database based on a search query.
 * @param {object} options - The options for the question retrieval.
 * @param {string} options.queryString - The search query string.
 * @param {number[]} options.difficulties - An array of difficulties to filter by.
 * @param {string} options.setName - The name of the set to search in.
 * @param {'question' | 'answer' | 'all'} [options.searchType='all'] - The type of search to perform.
 * @param {'tossup' | 'bonus' | 'all'} [options.questionType='all'] - The type of question to search for.
 * @param {string[]} [options.categories] - An array of categories to filter by.
 * @param {string[]} [options.subcategories] - An array of subcategories to filter by.
 * @param {number} [options.maxReturnLength] - The maximum number of questions to return.
 * @param {boolean} [options.randomize=false] - Whether to randomize the order of the returned questions.
 * @param {boolean} [options.regex=false] - Whether to treat the search query as a regular expression.
 * @param {boolean} [options.exactPhrase=false] - Whether to search for an exact phrase match.
 * @param {boolean} [options.ignoreDiacritics=false] - Whether to ignore diacritics in the search query.
 * @param {boolean} [options.powermarkOnly=false] - Whether to only search for powermarked questions.
 * @param {number} [options.tossupPagination=1] - The page number of the tossup pagination.
 * @returns {Promise<{tossups: {count: Number, questionArray: types.Tossup[]}, bonuses: {count: Number, questionArray: types.Bonus[]}}>} The retrieved questions.
 */
async function getQuery({
    queryString,
    difficulties,
    setName,
    searchType = 'all',
    questionType = 'all',
    categories,
    subcategories,
    maxReturnLength,
    randomize = false,
    regex = false,
    exactPhrase = false,
    ignoreDiacritics = false,
    powermarkOnly = false,
    tossupPagination = 1,
    bonusPagination = 1,
    minYear,
    maxYear,
    verbose = false,
} = {}) {
    if (verbose)
        console.time('getQuery');

    if (!queryString)
        queryString = '';

    if (!maxReturnLength)
        maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;

    maxReturnLength = parseInt(maxReturnLength);
    maxReturnLength = Math.min(maxReturnLength, MAX_QUERY_RETURN_LENGTH);

    if (maxReturnLength <= 0)
        maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;

    if (!regex) {
        queryString = queryString.trim();
        queryString = escapeRegExp(queryString);

        if (ignoreDiacritics) {
            queryString = regexIgnoreDiacritics(queryString);
        }

        if (exactPhrase) {
            queryString = `\\b${queryString}\\b`;
        }
    }

    const returnValue = { tossups: { count: 0, questionArray: [] }, bonuses: { count: 0, questionArray: [] }, queryString };

    let tossupQuery = null;
    if (['tossup', 'all'].includes(questionType))
        tossupQuery = queryHelperTossup({ queryString, difficulties, setName, searchType, categories, subcategories, maxReturnLength, randomize, tossupPagination, minYear, maxYear, powermarkOnly });

    let bonusQuery = null;
    if (['bonus', 'all'].includes(questionType))
        bonusQuery = queryHelperBonus({ queryString, difficulties, setName, searchType, categories, subcategories, maxReturnLength, randomize, bonusPagination, minYear, maxYear });


    const values = await Promise.all([tossupQuery, bonusQuery]);

    if (values[0])
        returnValue.tossups = values[0];

    if (values[1])
        returnValue.bonuses = values[1];

    if (verbose) {
        console.log(`\
[DATABASE] QUERY: string: ${OKCYAN}${queryString}${ENDC}; \
difficulties: ${OKGREEN}${difficulties}${ENDC}; \
max length: ${OKGREEN}${maxReturnLength}${ENDC}; \
question type: ${OKGREEN}${questionType}${ENDC}; \
ignore diacritics: ${OKGREEN}${ignoreDiacritics}${ENDC}; \
randomize: ${OKGREEN}${randomize}${ENDC}; \
regex: ${OKGREEN}${regex}${ENDC}; \
search type: ${OKGREEN}${searchType}${ENDC}; \
set name: ${OKGREEN}${setName}${ENDC}; \
`);
        console.timeEnd('getQuery');
    }

    return returnValue;
}


async function queryHelperTossup({ queryString, difficulties, setName, searchType, categories, subcategories, maxReturnLength, randomize, tossupPagination, minYear, maxYear, powermarkOnly }) {
    const orQuery = [];
    if (['question', 'all'].includes(searchType))
        orQuery.push({ question: { $regex: queryString, $options: 'i' } });

    if (['answer', 'all'].includes(searchType))
        orQuery.push({ answer: { $regex: queryString, $options: 'i' } });

    const [aggregation, query] = buildQueryAggregation({
        orQuery, difficulties, categories, subcategories, setName, maxReturnLength, randomize, minYear, maxYear, powermarkOnly,
        isEmpty: queryString === '',
    });

    try {
        const [questionArray, count] = await Promise.all([
            tossups.aggregate(aggregation).skip((tossupPagination - 1) * maxReturnLength).limit(maxReturnLength).toArray(),
            tossups.countDocuments(query),
        ]);
        return { count, questionArray };
    } catch (MongoServerError) {
        console.log(MongoServerError);
        return { count: 0, questionArray: [] };
    }
}


async function queryHelperBonus({ queryString, difficulties, setName, searchType, categories, subcategories, maxReturnLength, randomize, bonusPagination, minYear, maxYear }) {
    const orQuery = [];
    if (['question', 'all'].includes(searchType)) {
        orQuery.push({ parts: { $regex: queryString, $options: 'i' } });
        orQuery.push({ leadin: { $regex: queryString, $options: 'i' } });
    }

    if (['answer', 'all'].includes(searchType)) {
        orQuery.push({ answers: { $regex: queryString, $options: 'i' } });
    }

    const [aggregation, query] = buildQueryAggregation({
        orQuery, difficulties, categories, subcategories, setName, maxReturnLength, randomize, minYear, maxYear,
        isEmpty: queryString === '',
    });

    try {
        const [questionArray, count] = await Promise.all([
            bonuses.aggregate(aggregation).skip((bonusPagination - 1) * maxReturnLength).limit(maxReturnLength).toArray(),
            bonuses.countDocuments(query),
        ]);
        return { count, questionArray };
    } catch (MongoServerError) {
        console.log(MongoServerError);
        return { count: 0, questionArray: [] };
    }
}


function buildQueryAggregation({ orQuery, difficulties, categories, subcategories, setName, maxReturnLength, randomize, minYear, maxYear, isEmpty, powermarkOnly }) {
    const query = {
        $or: orQuery,
    };

    if (isEmpty)
        delete query.$or;

    if (difficulties)
        query.difficulty = { $in: difficulties };

    if (categories)
        query.category = { $in: categories };

    if (subcategories)
        query.subcategory = { $in: subcategories };

    if (setName)
        query['set.name'] = setName;

    if (minYear && maxYear) {
        query['set.year'] = { $gte: minYear, $lte: maxYear };
    } else if (minYear)
        query['set.year'] = { $gte: minYear };
    else if (maxYear) {
        query['set.year'] = { $lte: maxYear };
    }

    if (powermarkOnly)
        query.question = { $regex: '\\(\\*\\)' };

    const aggregation = [
        { $match: query },
        { $sort: {
            'set.name': -1,
            'packet.number': 1,
            questionNumber: 1,
        } },
        // { $skip: (pagination - 1) * maxReturnLength },
        // { $limit: maxReturnLength },
        { $project: { reports: 0 } },
    ];

    if (randomize)
        aggregation[1] = { $sample: { size: maxReturnLength } };

    return [aggregation, query];
}

export default getQuery;
