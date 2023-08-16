import { OKCYAN, ENDC, OKGREEN } from '../bcolors.js';
import { ADJECTIVES, ANIMALS, DEFAULT_QUERY_RETURN_LENGTH, MAX_QUERY_RETURN_LENGTH, DIFFICULTIES, CATEGORIES, SUBCATEGORY_TO_CATEGORY, SUBCATEGORIES_FLATTENED, DEFAULT_MIN_YEAR, DEFAULT_MAX_YEAR } from '../constants.js';

import { MongoClient, ObjectId } from 'mongodb';

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function connectToDatabase(log=false) {
    await client.connect();

    if (log) {
        console.log('connected to mongodb');
    }
}

async function closeDatabase() {
    await client.close();
}

await connectToDatabase(true);

const database = client.db('qbreader');
const sets = database.collection('sets');
const packets = database.collection('packets');
const tossups = database.collection('tossups');
const bonuses = database.collection('bonuses');

const accountInfo = client.db('account-info');
const tossupData = accountInfo.collection('tossup-data');
const bonusData = accountInfo.collection('bonus-data');

const SET_LIST = []; // initialized on server load
sets.find({}, { projection: { _id: 0, name: 1 }, sort: { name: -1 } }).forEach(set => {
    SET_LIST.push(set.name);
});


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
 *
 * @param {"wrong-category" | "text-error"} reason
 * @returns
 */
async function getReports(reason) {
    const reports = {};
    reports.tossups = await tossups.find({ 'reports.reason': reason }, { sort: { 'set.year': -1 } }).toArray();
    reports.bonuses = await bonuses.find({ 'reports.reason': reason }, { sort: { 'set.year': -1 } }).toArray();
    return reports;
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @returns {Promise<Number>} the number of packets in the set.
 */
async function getNumPackets(setName) {
    if (!setName) {
        return 0;
    }

    return await packets.countDocuments({ 'set.name': setName });
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {Number} packetNumber - **one-indexed** packet number
 * @param {Array<String>} questionTypes - Default: `['tossups', 'bonuses]`
 * If only one allowed type is specified, only that type will be searched for (increasing query speed).
 * The other type will be returned as an empty array.
 * @returns {Promise<{tossups: Array<JSON>, bonuses: Array<JSON>}>}
 */
async function getPacket({ setName, packetNumber, questionTypes = ['tossups', 'bonuses'], replaceUnformattedAnswer = true }) {
    if (!setName || isNaN(packetNumber) || packetNumber < 1) {
        return { 'tossups': [], 'bonuses': [] };
    }

    if (!SET_LIST.includes(setName)) {
        console.log(`[DATABASE] WARNING: "${setName}" not found in SET_LIST`);
        return { 'tossups': [], 'bonuses': [] };
    }

    const packet = await packets.findOne({ 'set.name': setName, number: packetNumber });

    if (!packet)
        return { 'tossups': [], 'bonuses': [] };

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


/**
 *
 * @param {String} queryString - the query to search for
 * @param {Array<Number>} difficulties - an array of difficulties
 * @param {String} setName
 * @param {'question' | 'answer' | 'all'} searchType
 * @param {'tossup' | 'bonus' | 'all'} questionType
 * @param {Array<String>} categories
 * @param {Array<String>} subcategories
 * @returns {Promise<{tossups: {count: Number, questionArray: Array<JSON>}, bonuses: {count: Number, questionArray: Array<JSON>}}>}
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


function getRandomName() {
    const ADJECTIVE_INDEX = Math.floor(Math.random() * ADJECTIVES.length);
    const ANIMAL_INDEX = Math.floor(Math.random() * ANIMALS.length);
    return `${ADJECTIVES[ADJECTIVE_INDEX]}-${ANIMALS[ANIMAL_INDEX]}`;
}


/**
 * Get an array of random tossups. This method is 3-4x faster than using the randomize option in getQuery.
 * @param {Object} object - an object containing the parameters
 * @param {Array<Number>} object.difficulties
 * @param {Array<String>} object.categories
 * @param {Array<String>} object.subcategories
 * @param {Number} object.number
 * @param {Number} object.minYear
 * @param {Number} object.maxYear
 * @param {Boolean} object.powermarkOnly
 * @param difficulties - an array of allowed difficulty levels (1-10). Pass a 0-length array, null, or undefined to select any difficulty.
 * @param categories - an array of allowed categories. Pass a 0-length array, null, or undefined to select any category.
 * @param subcategories - an array of allowed subcategories. Pass a 0-length array, null, or undefined to select any subcategory.
 * @param number - how many random tossups to return. Default: 1.
 * @param minYear - the minimum year to select from. Default: 2010.
 * @param maxYear - the maximum year to select from. Default: 2023.
 * @returns {Promise<Array<JSON>>}
 */
async function getRandomTossups({
    difficulties = DIFFICULTIES,
    categories = CATEGORIES,
    subcategories = SUBCATEGORIES_FLATTENED,
    number = 1,
    minYear = DEFAULT_MIN_YEAR,
    maxYear = DEFAULT_MAX_YEAR,
    powermarkOnly = false,
} = {}) {
    const aggregation = [
        { $match: { 'set.year': { $gte: minYear, $lte: maxYear } } },
        { $sample: { size: number } },
        { $project: { reports: 0 } },
    ];

    if (difficulties.length) {
        aggregation[0].$match.difficulty = { $in: difficulties };
    }

    if (categories.length) {
        aggregation[0].$match.category = { $in: categories };
    }

    if (subcategories.length) {
        aggregation[0].$match.subcategory = { $in: subcategories };
    }

    if (powermarkOnly) {
        aggregation[0].$match.question = { $regex: '\\(\\*\\)' };
    }

    return await tossups.aggregate(aggregation).toArray();
}


/**
 * Get an array of random bonuses. This method is 3-4x faster than using the randomize option in getQuery.
 * @param {Object} object - an object containing the parameters
 * @param {Array<Number>} object.difficulties
 * @param {Array<String>} object.categories
 * @param {Array<String>} object.subcategories
 * @param {Number} object.number
 * @param {Number} object.minYear
 * @param {Number} object.maxYear
 * @param {Number | null | undefined} object.bonusLength
 * @param difficulties - an array of allowed difficulty levels (1-10). Pass a 0-length array, null, or undefined to select any difficulty.
 * @param categories - an array of allowed categories. Pass a 0-length array, null, or undefined to select any category.
 * @param subcategories - an array of allowed subcategories. Pass a 0-length array, null, or undefined to select any subcategory.
 * @param number - how many random bonuses to return. Default: 1.
 * @param minYear - the minimum year to select from. Default: 2010.
 * @param maxYear - the maximum year to select from. Default: 2023.
 * @param bonusLength - if not null or undefined, only return bonuses with number of parts equal to `bonusLength`.
 * @returns {Promise<Array<JSON>>}
 */
async function getRandomBonuses({
    difficulties = DIFFICULTIES,
    categories = CATEGORIES,
    subcategories = SUBCATEGORIES_FLATTENED,
    number = 1,
    minYear = DEFAULT_MIN_YEAR,
    maxYear = DEFAULT_MAX_YEAR,
    bonusLength,
} = {}) {
    const aggregation = [
        { $match: { 'set.year': { $gte: minYear, $lte: maxYear } } },
        { $sample: { size: number } },
        { $project: { reports: 0 } },
    ];

    if (difficulties.length) {
        aggregation[0].$match.difficulty = { $in: difficulties };
    }

    if (categories.length) {
        aggregation[0].$match.category = { $in: categories };
    }

    if (subcategories.length) {
        aggregation[0].$match.subcategory = { $in: subcategories };
    }

    if (bonusLength) {
        bonusLength = parseInt(bonusLength);
        aggregation[0].$match.parts = { $size: bonusLength };
        aggregation[0].$match.answers = { $size: bonusLength };
    }

    return await bonuses.aggregate(aggregation).toArray();
}


/**
 * Gets all questions in a set that satisfy the given parameters.
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {Array<Number>} packetNumbers - an array of packet numbers to search. Each packet number is 1-indexed.
 * @param {Array<String>} categories
 * @param {Array<String>} subcategories
 * @param {'tossup' | 'bonus'} questionType - Type of question you want to get. Default: `'tossup'`.
 * @param {Boolean} replaceUnformattedAnswer - whether to replace the 'answer(s)' key on each question with the value corresponding to 'formatted_answer(s)' (if it exists). Default: `true`
 * @param {Boolean} reverse - whether to reverse the order of the questions in the array. Useful for functions that pop at the end of the array, Default: `false`
 * @returns {Promise<Array<JSON>>}
 */
async function getSet({ setName, packetNumbers, categories, subcategories, questionType = 'tossup', replaceUnformattedAnswer = true, reverse = false }) {
    if (!setName) return [];

    if (!SET_LIST.includes(setName)) {
        console.log(`[DATABASE] WARNING: "${setName}" not found in SET_LIST`);
        return [];
    }

    if (!categories || categories.length === 0) categories = CATEGORIES;
    if (!subcategories || subcategories.length === 0) subcategories = SUBCATEGORIES_FLATTENED;
    if (!questionType) questionType = 'tossup';

    const filter = {
        'set.name': setName,
        category: { $in: categories },
        subcategory: { $in: subcategories },
        'packet.number': { $in: packetNumbers },
    };

    const options = {
        sort: { 'packet.number': reverse ? -1 : 1, questionNumber: reverse ? -1 : 1 },
        project: { reports: 0 },
    };

    if (questionType === 'tossup') {
        const questionArray = await tossups.find(filter, options).toArray();

        if (replaceUnformattedAnswer) {
            for (let i = 0; i < questionArray.length; i++) {
                if (questionArray[i].formatted_answer) {
                    questionArray[i].answer = questionArray[i].formatted_answer;
                }
            }
        }

        return questionArray || [];
    } else if (questionType === 'bonus') {
        const questionArray = await bonuses.find(filter, options).toArray();

        if (replaceUnformattedAnswer) {
            for (let i = 0; i < questionArray.length; i++) {
                if (questionArray[i].formatted_answers) {
                    questionArray[i].answers = questionArray[i].formatted_answers;
                }
            }
        }

        return questionArray || [];
    }
}


async function getSetId(name) {
    const set = await sets.findOne({ name });
    return set ? set._id : null;
}


/**
 * @returns {Array<String>} an array of all the set names.
 */
function getSetList() {
    return SET_LIST;
}


/**
 *
 * @param {ObjectId} _id
 * @returns Promise<Document>
 */
async function getBonusById(_id) {
    return await bonuses.findOne({ _id: _id });
}


/**
 *
 * @param {ObjectId} _id
 * @returns Promise<Document>
 */
async function getTossupById(_id) {
    return await tossups.findOne({ _id: _id });
}


/**
 * Report question with given id to the database.
 * @param {String} _id
 * @returns {Promise<Boolean>} true if successful, false otherwise.
 */
async function reportQuestion(_id, reason, description, verbose = true) {
    tossups.updateOne({ _id: new ObjectId(_id) }, {
        $push: { reports: {
            reason: reason,
            description: description,
        } },
    });

    bonuses.updateOne({ _id: new ObjectId(_id) }, {
        $push: { reports: {
            reason: reason,
            description: description,
        } },
    });

    if (verbose)
        console.log('Reported question with id ' + _id);

    return true;
}


/**
 *
 * @param {ObjectId} _id the id of the question to update
 * @param {'tossup' | 'bonus'} type the type of question to update
 * @param {String} subcategory the new subcategory to set
 * @param {Boolean} clearReports whether to clear the reports field
 * @returns {Promise<UpdateResult>}
 */
async function updateSubcategory(_id, type, subcategory, clearReports = true) {
    if (!(subcategory in SUBCATEGORY_TO_CATEGORY)) {
        console.log(`Subcategory ${subcategory} not found`);
        return;
    }

    const category = SUBCATEGORY_TO_CATEGORY[subcategory];
    const updateDoc = { $set: { category, subcategory, updatedAt: new Date() } };

    if (clearReports)
        updateDoc.$unset = { reports: 1 };

    switch (type) {
    case 'tossup':
        tossupData.updateMany({ tossup_id: _id }, { $set: { category, subcategory } });
        return await tossups.updateOne({ _id }, updateDoc);
    case 'bonus':
        bonusData.updateMany({ bonus_id: _id }, { $set: { category, subcategory } });
        return await bonuses.updateOne({ _id }, updateDoc);
    }
}


export {
    closeDatabase,
    connectToDatabase,
    getBonusById,
    getNumPackets,
    getPacket,
    getQuery,
    getRandomName,
    getRandomTossups,
    getRandomBonuses,
    getReports,
    getSet,
    getSetId,
    getSetList,
    getTossupById,
    reportQuestion,
    updateSubcategory,
};
