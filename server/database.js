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

const bcolors = require('../bcolors');
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
const MAX_QUERY_RETURN_LENGTH = 400;

/**
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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
 * @returns {Promise<JSON>}
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

    const questionArray = await questions.find({
        setName: setName,
        category: { $in: categories },
        subcategory: { $in: subcategories },
        packetNumber: { $in: packetNumbers },
        type: questionType
    }, {
        sort: { packetNumber: reverse ? -1 : 1, questionNumber: reverse ? -1 : 1 }
    }).toArray();

    if (replaceUnformattedAnswer && questionType === 'tossup') {
        for (let i = 0; i < questionArray.length; i++) {
            if (questionArray[i].formatted_answer) {
                questionArray[i].answer = questionArray[i].formatted_answer;
            }
        }
    }

    return questionArray || [];
}


/**
 * @param {String} setName - the name of the set (e.g. "2021 ACF Fall").
 * @returns {Promise<Number>} the number of packets in the set.
 */
async function getNumPackets(setName) {
    if (!setName) return 0;

    if (!SET_LIST.includes(setName)) {
        console.log(`[DATABASE] WARNING: "${setName}" not found in SET_LIST`);
        return 0;
    }

    return await sets.findOne({ name: setName }).then(set => {
        return set ? (set.packets.length) : 0;
    }).catch(error => {
        console.log('[DATABASE] ERROR:', error);
        return 0;
    });
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

    return await sets.findOne({ name: setName }).then(async set => {
        if (packetNumber > set.packets.length) {
            return { 'tossups': [], 'bonuses': [] };
        }

        const packet = set.packets[packetNumber - 1];
        const result = {};

        if (questionTypes.includes('tossups')) {
            result['tossups'] = await questions.find({ packet: packet._id, type: 'tossup' }, { sort: { questionNumber: 1 } }).toArray();
            if (replaceUnformattedAnswer) {
                for (const question of result['tossups']) {
                    if (Object.prototype.hasOwnProperty.call(question, 'formatted_answer')) {
                        question.answer = question.formatted_answer;
                    }
                }
            }
        }

        if (questionTypes.includes('bonuses')) {
            result['bonuses'] = await questions.find({ packet: packet._id, type: 'bonus' }, { sort: { questionNumber: 1 } }).toArray();
            if (replaceUnformattedAnswer) {
                for (const question of result['bonuses']) {
                    if (Object.prototype.hasOwnProperty.call(question, 'formatted_answers')) {
                        question.answers = question.formatted_answers;
                    }
                }
            }
        }

        return result;
    }).catch(error => {
        console.log('[DATABASE] ERROR:', error);
        return { 'tossups': [], 'bonuses': [] };
    });
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
async function getQuery({ queryString, difficulties, setName, searchType = 'all', questionType = 'all', categories, subcategories, maxReturnLength, randomize = false, regex = false } = {}) {
    if (!queryString) queryString = '';
    if (!difficulties || difficulties.length === 0) difficulties = [0].concat(DIFFICULTIES);
    if (!categories || categories.length === 0) categories = CATEGORIES;
    if (!subcategories || subcategories.length === 0) subcategories = SUBCATEGORIES_FLATTENED_ALL;
    if (!setName) setName = '';
    if (!maxReturnLength) maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;

    maxReturnLength = parseInt(maxReturnLength);
    maxReturnLength = Math.min(maxReturnLength, MAX_QUERY_RETURN_LENGTH);
    if (maxReturnLength <= 0) maxReturnLength = DEFAULT_QUERY_RETURN_LENGTH;

    if (!regex) {
        queryString = queryString.trim();
        queryString = escapeRegExp(queryString);
    }

    const returnValue = { tossups: { count: 0, questionArray: [] }, bonuses: { count: 0, questionArray: [] } };
    if (questionType === 'tossup' || questionType === 'all') {
        const tossups = await queryHelper({ queryString, difficulties, setName, questionType: 'tossup', searchType, categories, subcategories, maxReturnLength, randomize });
        returnValue.tossups = tossups;
    }

    if (questionType === 'bonus' || questionType === 'all') {
        const bonuses = await queryHelper({ queryString, difficulties, setName, questionType: 'bonus', searchType, categories, subcategories, maxReturnLength, randomize });
        returnValue.bonuses = bonuses;
    }

    console.log(`[DATABASE] QUERY: string: ${bcolors.OKCYAN}${queryString}${bcolors.ENDC}; difficulties: ${bcolors.OKGREEN}${difficulties}${bcolors.ENDC}; max length: ${bcolors.OKGREEN}${maxReturnLength}${bcolors.ENDC}; question type: ${bcolors.OKGREEN}${questionType}${bcolors.ENDC}; randomize: ${bcolors.OKGREEN}${randomize}${bcolors.ENDC}; regex: ${bcolors.OKGREEN}${regex}${bcolors.ENDC}; search type: ${bcolors.OKGREEN}${searchType}${bcolors.ENDC}; set name: ${bcolors.OKGREEN}${setName}${bcolors.ENDC};`);

    return returnValue;
}

async function queryHelper({ queryString, difficulties, questionType, setName, searchType, categories, subcategories, maxReturnLength, randomize }) {
    const orQuery = [];
    if (['question', 'all'].includes(searchType)) {
        if (questionType === 'tossup') {
            orQuery.push({ question: { $regex: queryString, $options: 'i' } });
        } else if (questionType === 'bonus') {
            orQuery.push({ parts: { $regex: queryString, $options: 'i' } });
            orQuery.push({ leadin: { $regex: queryString, $options: 'i' } });
        }
    }

    if (['answer', 'all'].includes(searchType)) {
        if (questionType === 'tossup') {
            orQuery.push({ answer: { $regex: queryString, $options: 'i' } });
        } else if (questionType === 'bonus') {
            orQuery.push({ answers: { $regex: queryString, $options: 'i' } });
        }
    }

    const query = {
        $or: orQuery,
        type: questionType,
        difficulty: { $in: difficulties },
        category: { $in: categories },
        subcategory: { $in: subcategories },
    };

    if (setName) {
        query.setName = setName;
    }

    const aggregation = [
        { $match: query, },
        {
            $sort: {
                setName: -1,
                packetNumber: 1,
                questionNumber: 1
            }
        },
        { $limit: maxReturnLength },
    ];

    if (randomize) {
        aggregation[1] = { $sample: { size: maxReturnLength } };
    }

    try {
        const questionArray = await questions.aggregate(aggregation).toArray();
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


function getRandomName() {
    const ADJECTIVE_INDEX = Math.floor(Math.random() * ADJECTIVES.length);
    const ANIMAL_INDEX = Math.floor(Math.random() * ANIMALS.length);
    return `${ADJECTIVES[ADJECTIVE_INDEX]}-${ANIMALS[ANIMAL_INDEX]}`;
}


/**
 * Get an array of random questions. This method is 3-4x faster than using the randomize option in getQuery.
 * @param {'tossup' | 'bonus'} questionType - the type of question to get
 * @param {Array<Number>} difficulties - an array of allowed difficulty levels (1-10). Pass a 0-length array to select any difficulty.
 * @param {Array<String>} categories - an array of allowed categories. Pass a 0-length array to select any category.
 * @param {Array<String>} subcategories - an array of allowed subcategories. Pass a 0-length array to select any subcategory.
 * @param {Number} number - how many random tossups to return. Default: 20.
 * @returns {Promise<Array<JSON>>}
 */
async function getRandomQuestions({ questionType = 'tossup', difficulties, categories, subcategories, number }) {
    if (!difficulties || difficulties.length === 0) difficulties = DIFFICULTIES;
    if (!categories || categories.length === 0) categories = CATEGORIES;
    if (!subcategories || subcategories.length === 0) subcategories = SUBCATEGORIES_FLATTENED;
    if (!number) number = 20;

    const questionArray = await questions.aggregate([
        { $match: { type: questionType, difficulty: { $in: difficulties }, category: { $in: categories }, subcategory: { $in: subcategories } } },
        { $sample: { size: number } },
    ]).toArray();

    if (questionArray.length === 0) {
        return [{}];
    }

    console.log(`[DATABASE] RANDOM QUESTIONS: difficulties: ${bcolors.OKGREEN}${difficulties}${bcolors.ENDC}; number: ${bcolors.OKGREEN}${number}${bcolors.ENDC}; question type: ${bcolors.OKGREEN}${questionType}${bcolors.ENDC}; categories: ${bcolors.OKGREEN}${categories}${bcolors.ENDC}; subcategories: ${bcolors.OKGREEN}${subcategories}${bcolors.ENDC};`);
    return questionArray;
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
        console.log('[DATABASE] ERROR:', error);
        return false;
    });
}


module.exports = { DEFAULT_QUERY_RETURN_LENGTH, getSet, getNumPackets, getPacket, getQuery, getRandomQuestions, getSetList, getRandomName, reportQuestion };
