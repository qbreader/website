if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const { MongoClient, ObjectId } = require('mongodb');
const { DIFFICULTIES, CATEGORIES, SUBCATEGORIES_FLATTENED, SUBCATEGORIES_FLATTENED_ALL } = require('./quizbowl');

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME || 'geoffreywu42'}:${process.env.MONGODB_PASSWORD || 'password'}@qbreader.0i7oej9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);
client.connect().then(async () => {
    console.log('connected to mongodb');
});

const colors = require('../colors');
const database = client.db('qbreader');
const questions = database.collection('questions');
const sets = database.collection('sets');

const SET_LIST = []; // initialized on server load
sets.find({}, { projection: { _id: 0, name: 1 }, sort: { name: -1 } }).forEach(set => {
    SET_LIST.push(set.name);
});


const ADJECTIVES = ['adaptable', 'adept', 'affectionate', 'agreeable', 'alluring', 'amazing', 'ambitious', 'amiable', 'ample', 'approachable', 'awesome', 'blithesome', 'bountiful', 'brave', 'breathtaking', 'bright', 'brilliant', 'capable', 'captivating', 'charming', 'competitive', 'confident', 'considerate', 'courageous', 'creative', 'dazzling', 'determined', 'devoted', 'diligent', 'diplomatic', 'dynamic', 'educated', 'efficient', 'elegant', 'enchanting', 'energetic', 'engaging', 'excellent', 'fabulous', 'faithful', 'fantastic', 'favorable', 'fearless', 'flexible', 'focused', 'fortuitous', 'frank', 'friendly', 'funny', 'generous', 'giving', 'gleaming', 'glimmering', 'glistening', 'glittering', 'glowing', 'gorgeous', 'gregarious', 'gripping', 'hardworking', 'helpful', 'hilarious', 'honest', 'humorous', 'imaginative', 'incredible', 'independent', 'inquisitive', 'insightful', 'kind', 'knowledgeable', 'likable', 'lovely', 'loving', 'loyal', 'lustrous', 'magnificent', 'marvelous', 'mirthful', 'moving', 'nice', 'optimistic', 'organized', 'outstanding', 'passionate', 'patient', 'perfect', 'persistent', 'personable', 'philosophical', 'plucky', 'polite', 'powerful', 'productive', 'proficient', 'propitious', 'qualified', 'ravishing', 'relaxed', 'remarkable', 'resourceful', 'responsible', 'romantic', 'rousing', 'sensible', 'shimmering', 'shining', 'sincere', 'sleek', 'sparkling', 'spectacular', 'spellbinding', 'splendid', 'stellar', 'stunning', 'stupendous', 'super', 'technological', 'thoughtful', 'twinkling', 'unique', 'upbeat', 'vibrant', 'vivacious', 'vivid', 'warmhearted', 'willing', 'wondrous', 'zestful'];
const ANIMALS = ['aardvark', 'alligator', 'alpaca', 'anaconda', 'ant', 'anteater', 'antelope', 'aphid', 'armadillo', 'baboon', 'badger', 'barracuda', 'bat', 'beaver', 'bedbug', 'bee', 'bird', 'bison', 'bobcat', 'buffalo', 'butterfly', 'buzzard', 'camel', 'carp', 'cat', 'caterpillar', 'catfish', 'cheetah', 'chicken', 'chimpanzee', 'chipmunk', 'cobra', 'cod', 'condor', 'cougar', 'cow', 'coyote', 'crab', 'cricket', 'crocodile', 'crow', 'cuckoo', 'deer', 'dinosaur', 'dog', 'dolphin', 'donkey', 'dove', 'dragonfly', 'duck', 'eagle', 'eel', 'elephant', 'emu', 'falcon', 'ferret', 'finch', 'fish', 'flamingo', 'flea', 'fly', 'fox', 'frog', 'goat', 'goose', 'gopher', 'gorilla', 'hamster', 'hare', 'hawk', 'hippopotamus', 'horse', 'hummingbird', 'husky', 'iguana', 'impala', 'kangaroo', 'lemur', 'leopard', 'lion', 'lizard', 'llama', 'lobster', 'margay', 'monkey', 'moose', 'mosquito', 'moth', 'mouse', 'mule', 'octopus', 'orca', 'ostrich', 'otter', 'owl', 'ox', 'oyster', 'panda', 'parrot', 'peacock', 'pelican', 'penguin', 'perch', 'pheasant', 'pig', 'pigeon', 'porcupine', 'quagga', 'rabbit', 'raccoon', 'rat', 'rattlesnake', 'rooster', 'seal', 'sheep', 'skunk', 'sloth', 'snail', 'snake', 'spider', 'tiger', 'whale', 'wolf', 'wombat', 'zebra'];

const DEFAULT_QUERY_RETURN_LENGTH = 50;
const MAX_QUERY_RETURN_LENGTH = 200;

/**
 * Gets the next question with a question number greater than `currentQuestionNumber` that satisfies the given conditions.
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {Array<Number>} packetNumbers - an array of packet numbers to search. Each packet number is 1-indexed.
 * @param {Number} currentQuestionNumber - current question number. **Starts at 1.**
 * @param {Array<String>} validCategories
 * @param {Array<String>} validSubcategories
 * @param {'tossup' | 'bonus'} type - Type of question you want to get. Default: `'tossup'`.
 * @param {Boolean} alwaysUseUnformattedAnswer - whether to always use the unformatted answer. Default: `false`
 * @returns {Promise<JSON>}
 */
async function getNextQuestion(setName, packetNumbers, currentQuestionNumber, validCategories, validSubcategories, type = 'tossup', alwaysUseUnformattedAnswer = false) {
    if (!SET_LIST.includes(setName)) {
        console.log(`WARNING: "${setName}" not found in SET_LIST`);
        return 0;
    }

    let set = await sets.findOne({ name: setName }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return {};
    });

    if (validCategories.length === 0) validCategories = CATEGORIES;
    if (validSubcategories.length === 0) validSubcategories = SUBCATEGORIES_FLATTENED;

    let question = await questions.findOne({
        $or: [
            {
                set: set._id,
                category: { $in: validCategories },
                subcategory: { $in: validSubcategories },
                packetNumber: packetNumbers[0],
                questionNumber: { $gt: currentQuestionNumber },
                type: type
            },
            {
                set: set._id,
                category: { $in: validCategories },
                subcategory: { $in: validSubcategories },
                packetNumber: { $in: packetNumbers.slice(1) },
                type: type
            },
        ]
    }, {
        sort: { packetNumber: 1, questionNumber: 1 }
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return {};
    });

    if (!question) {
        return {};
    }

    question.setName = setName;

    if (!alwaysUseUnformattedAnswer && question.hasOwnProperty('formatted_answer')) {
        question.answer = question.formatted_answer;
    }

    return question || {};
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @returns {Promise<Number>} the number of packets in the set.
 */
async function getNumPackets(setName) {
    if (!SET_LIST.includes(setName)) {
        console.log(`WARNING: "${setName}" not found in SET_LIST`);
        return 0;
    }

    return await sets.findOne({ name: setName }).then(set => {
        return set ? (set.packets.length) : 0;
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return 0;
    });
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @param {Number} packetNumber - **one-indexed** packet number
 * @param {Array<String>} allowedTypes - Array of allowed types. Default: `['tossups', 'bonuses]`
 * If only one allowed type is specified, only that type will be searched for (increasing query speed).
 * The other type will be returned as an empty array.
 * @returns {Promise<{tossups: Array<JSON>, bonuses: Array<JSON>}>}
 */
async function getPacket(setName, packetNumber, allowedTypes = ['tossups', 'bonuses'], alwaysUseUnformattedAnswer = false) {
    if (!SET_LIST.includes(setName)) {
        console.log(`WARNING: "${setName}" not found in SET_LIST`);
        return { 'tossups': [], 'bonuses': [] };
    }

    return await sets.findOne({ name: setName }).then(async set => {
        let packet = set.packets[packetNumber - 1];
        let result = {};

        if (allowedTypes.includes('tossups')) {
            result['tossups'] = await questions.find({ packet: packet._id, type: 'tossup' }, { sort: { questionNumber: 1 } }).toArray();
            if (!alwaysUseUnformattedAnswer) {
                for (let question of result['tossups']) {
                    if (question.hasOwnProperty('formatted_answer')) {
                        question.answer = question.formatted_answer;
                    }
                }
            }
        }

        if (allowedTypes.includes('bonuses')) {
            result['bonuses'] = await questions.find({ packet: packet._id, type: 'bonus' }, { sort: { questionNumber: 1 } }).toArray();
            if (!alwaysUseUnformattedAnswer) {
                for (let question of result['bonuses']) {
                    if (question.hasOwnProperty('formatted_answers')) {
                        question.answers = question.formatted_answers;
                    }
                }
            }
        }

        return result;
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return { 'tossups': [], 'bonuses': [] };
    });
}

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 *
 * @param {String} queryString - the query to search for
 * @param {Array<Number>} difficulties
 * @param {String} setName
 * @param {'question' | 'answer' | 'all'} searchType
 * @param {'tossup' | 'bonus' | 'all'} questionType
 * @param {Array<String>} categories
 * @param {Array<String>} subcategories
 * @returns {Promise<{'tossups': {'count': Number, 'questionArray': Array<JSON>}, 'bonuses': {'count': Number, 'questionArray': Array<JSON>}}>}
 */
async function getQuery({ queryString = '', difficulties = DIFFICULTIES, setName = '', searchType = 'all', questionType = 'all', categories = CATEGORIES, subcategories = SUBCATEGORIES_FLATTENED_ALL, maxQueryReturnLength = DEFAULT_QUERY_RETURN_LENGTH, randomize = false }) {
    if (difficulties.length === 0) difficulties = DIFFICULTIES;
    if (categories.length === 0) categories = CATEGORIES;
    if (subcategories.length === 0) subcategories = SUBCATEGORIES_FLATTENED_ALL;

    maxQueryReturnLength = parseInt(maxQueryReturnLength);
    if (maxQueryReturnLength <= 0) {
        maxQueryReturnLength = DEFAULT_QUERY_RETURN_LENGTH;
    }
    maxQueryReturnLength = Math.min(maxQueryReturnLength, MAX_QUERY_RETURN_LENGTH);

    let returnValue = { tossups: { count: 0, questionArray: [] }, bonuses: { count: 0, questionArray: [] } };
    if (questionType === 'tossup' || questionType === 'all') {
        const tossups = await getTossupQuery({ queryString, difficulties, setName, searchType, categories, subcategories, maxQueryReturnLength, randomize });
        returnValue.tossups = tossups;
    }

    if (questionType === 'bonus' || questionType === 'all') {
        const bonuses = await getBonusQuery({ queryString, difficulties, setName, searchType, categories, subcategories, maxQueryReturnLength, randomize });
        returnValue.bonuses = bonuses;
    }

    console.log(`DATABASE QUERY: query string: ${colors.OKCYAN}${queryString}${colors.ENDC}; question type: ${colors.OKGREEN}${questionType}${colors.ENDC}; search type: ${colors.OKGREEN}${searchType}${colors.ENDC}; difficulties: ${colors.OKGREEN}${difficulties}${colors.ENDC}; set name: ${colors.OKGREEN}${setName}${colors.ENDC}; max query return length: ${colors.OKGREEN}${maxQueryReturnLength}; randomize: ${colors.OKGREEN}${randomize}${colors.ENDC}`);

    return returnValue;
}


async function getTossupQuery({ queryString, difficulties, setName, searchType, categories, subcategories, maxQueryReturnLength, randomize }) {
    queryString = queryString.trim();
    queryString = escapeRegExp(queryString);
    const orQuery = [];
    if (searchType === 'question' || searchType === 'all') {
        orQuery.push({ question: { $regex: queryString, $options: 'i' } });
    }

    if (searchType === 'answer' || searchType === 'all') {
        orQuery.push({ answer: { $regex: queryString, $options: 'i' } });
    }

    const query = {
        $or: orQuery,
        type: 'tossup',
        difficulty: { $in: difficulties },
        category: { $in: categories },
        subcategory: { $in: subcategories },
    }

    if (setName) {
        query.setName = setName;
    }

    return queryHelper(query, maxQueryReturnLength, randomize);
}

async function getBonusQuery({ queryString, difficulties, setName, searchType, categories, subcategories, maxQueryReturnLength, randomize }) {
    queryString = queryString.trim();
    queryString = escapeRegExp(queryString);
    const orQuery = [];
    if (searchType === 'question' || searchType === 'all') {
        orQuery.push({ parts: { $regex: queryString, $options: 'i' } });
        orQuery.push({ leadin: { $regex: queryString, $options: 'i' } });
    }

    if (searchType === 'answer' || searchType === 'all') {
        orQuery.push({ answers: { $regex: queryString, $options: 'i' } });
    }

    const query = {
        $or: orQuery,
        type: 'bonus',
        difficulty: { $in: difficulties },
        category: { $in: categories },
        subcategory: { $in: subcategories },
    }

    if (setName) {
        query.setName = setName;
    }

    return queryHelper(query, maxQueryReturnLength, randomize);
}

async function queryHelper(query, maxQueryReturnLength, randomize) {
    const aggregation = [
        { $match: query, },
        {
            $sort: {
                setName: -1,
                packetNumber: 1,
                questionNumber: 1
            }
        },
        { $limit: maxQueryReturnLength },
    ];

    if (randomize) {
        aggregation[1] = { $sample: { size: maxQueryReturnLength } };
    }

    try {
        let questionArray = await questions.aggregate(aggregation).toArray();
        let count = await questions.aggregate([
            { $match: query, },
            { $count: 'count' }
        ]).toArray();

        if (count[0]) {
            count = count[0].count;
        } else {
            count = 0;
        }

        return { count, questionArray };

    } catch (MongoServerError) {
        console.log(MongoServerError);
        return { count: 0, questionArray: [] };
    }
}

/**
 * @param {'tossup' | 'bonus'} type - the type of question to get
 * @param {Array<Number>} difficulties - an array of allowed difficulty levels (1-10). Pass a 0-length array to select any difficulty.
 * @param {Array<String>} allowedCategories - an array of allowed categories. Pass a 0-length array to select any category.
 * @param {Array<String>} allowedSubcategories - an array of allowed subcategories. Pass a 0-length array to select any subcategory.
 * @param {Number} number - how many random tossups to return
 * @returns {Promise<Array<JSON>>}
 */
async function getRandomQuestion(type, difficulties, allowedCategories, allowedSubcategories, number = 1) {
    if (difficulties.length === 0) difficulties = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    if (allowedCategories.length === 0) allowedCategories = CATEGORIES;
    if (allowedSubcategories.length === 0) allowedSubcategories = SUBCATEGORIES_FLATTENED;

    let questionArray = await questions.aggregate([
        { $match: { type: type, difficulty: { $in: difficulties }, category: { $in: allowedCategories }, subcategory: { $in: allowedSubcategories } } },
        { $sample: { size: number } },
        {
            $lookup: {
                from: 'sets',
                localField: 'set',
                foreignField: '_id',
                as: 'setName'
            }
        }
    ]).toArray();

    questionArray.forEach(question => {
        question.setName = question.setName[0].name;
        return question;
    });

    if (questionArray.length === 0) {
        return [{}];
    }

    return questionArray;
}


function getRandomName() {
    const ADJECTIVE_INDEX = Math.floor(Math.random() * ADJECTIVES.length);
    const ANIMAL_INDEX = Math.floor(Math.random() * ANIMALS.length);
    return `${ADJECTIVES[ADJECTIVE_INDEX]}-${ANIMALS[ANIMAL_INDEX]}`;
}


/**
 * @returns {Array<String>} an array of all the set names.
 */
function getSetList() {
    return SET_LIST;
}


/**
 * Report question with given id to the database.
 * @param {String} _id
 * @returns {Promise<Boolean>} true if successful, false otherwise.
 */
async function reportQuestion(_id, reason, description) {
    return await questions.updateOne({ _id: new ObjectId(_id) }, {
        $push: {
            reports: {
                reason: reason,
                description: description
            }
        }
    }).then(() => {
        console.log('Reported question with id ' + _id);
        return true;
    }).catch(error => {
        console.log('DATABASE ERROR:', error);
        return false;
    });
}


module.exports = { DEFAULT_QUERY_RETURN_LENGTH, getNextQuestion, getNumPackets, getPacket, getQuery, getRandomQuestion, getSetList, getRandomName, reportQuestion };
