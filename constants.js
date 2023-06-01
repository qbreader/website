const DEFAULT_QUERY_RETURN_LENGTH = 25;
const MAX_QUERY_RETURN_LENGTH = 400;

const DEFAULT_MIN_YEAR = 2010;
const DEFAULT_MAX_YEAR = 2023;

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CATEGORIES = ['Literature', 'History', 'Science', 'Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
// const SUBCATEGORIES = [
//     ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
//     ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
//     ['Biology', 'Chemistry', 'Physics', 'Math', 'Other Science'],
//     ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
//     ['Religion'],
//     ['Mythology'],
//     ['Philosophy'],
//     ['Social Science'],
//     ['Current Events'],
//     ['Geography'],
//     ['Other Academic'],
//     ['Trash']
// ];
const SUBCATEGORIES_FLATTENED = ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature', 'American History', 'Ancient History', 'European History', 'World History', 'Other History', 'Biology', 'Chemistry', 'Physics', 'Math', 'Other Science', 'Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];

/**
 * List of multiplayer permanent room names.
 */
const PERMANENT_ROOMS = ['hsquizbowl', 'collegequizbowl', 'literature', 'history', 'science', 'fine-arts'];

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

const WEBSOCKET_MAX_PAYLOAD = 1024 * 1024 * 1; // 1 MB

const ADJECTIVES = ['adaptable', 'adept', 'affectionate', 'agreeable', 'alluring', 'amazing', 'ambitious', 'amiable', 'ample', 'approachable', 'awesome', 'blithesome', 'bountiful', 'brave', 'breathtaking', 'bright', 'brilliant', 'capable', 'captivating', 'charming', 'competitive', 'confident', 'considerate', 'courageous', 'creative', 'dazzling', 'determined', 'devoted', 'diligent', 'diplomatic', 'dynamic', 'educated', 'efficient', 'elegant', 'enchanting', 'energetic', 'engaging', 'excellent', 'fabulous', 'faithful', 'fantastic', 'favorable', 'fearless', 'flexible', 'focused', 'fortuitous', 'frank', 'friendly', 'funny', 'generous', 'giving', 'gleaming', 'glimmering', 'glistening', 'glittering', 'glowing', 'gorgeous', 'gregarious', 'gripping', 'hardworking', 'helpful', 'hilarious', 'honest', 'humorous', 'imaginative', 'incredible', 'independent', 'inquisitive', 'insightful', 'kind', 'knowledgeable', 'likable', 'lovely', 'loving', 'loyal', 'lustrous', 'magnificent', 'marvelous', 'mirthful', 'moving', 'nice', 'optimistic', 'organized', 'outstanding', 'passionate', 'patient', 'perfect', 'persistent', 'personable', 'philosophical', 'plucky', 'polite', 'powerful', 'productive', 'proficient', 'propitious', 'qualified', 'ravishing', 'relaxed', 'remarkable', 'resourceful', 'responsible', 'romantic', 'rousing', 'sensible', 'shimmering', 'shining', 'sincere', 'sleek', 'sparkling', 'spectacular', 'spellbinding', 'splendid', 'stellar', 'stunning', 'stupendous', 'super', 'technological', 'thoughtful', 'twinkling', 'unique', 'upbeat', 'vibrant', 'vivacious', 'vivid', 'warmhearted', 'willing', 'wondrous', 'zestful'];
const ANIMALS = ['aardvark', 'alligator', 'alpaca', 'anaconda', 'ant', 'anteater', 'antelope', 'aphid', 'armadillo', 'baboon', 'badger', 'barracuda', 'bat', 'beaver', 'bedbug', 'bee', 'bird', 'bison', 'bobcat', 'buffalo', 'butterfly', 'buzzard', 'camel', 'carp', 'cat', 'caterpillar', 'catfish', 'cheetah', 'chicken', 'chimpanzee', 'chipmunk', 'cobra', 'cod', 'condor', 'cougar', 'cow', 'coyote', 'crab', 'cricket', 'crocodile', 'crow', 'cuckoo', 'deer', 'dinosaur', 'dog', 'dolphin', 'donkey', 'dove', 'dragonfly', 'duck', 'eagle', 'eel', 'elephant', 'emu', 'falcon', 'ferret', 'finch', 'fish', 'flamingo', 'flea', 'fly', 'fox', 'frog', 'goat', 'goose', 'gopher', 'gorilla', 'hamster', 'hare', 'hawk', 'hippopotamus', 'horse', 'hummingbird', 'husky', 'iguana', 'impala', 'kangaroo', 'lemur', 'leopard', 'lion', 'lizard', 'llama', 'lobster', 'margay', 'monkey', 'moose', 'mosquito', 'moth', 'mouse', 'mule', 'octopus', 'orca', 'ostrich', 'otter', 'owl', 'ox', 'oyster', 'panda', 'parrot', 'peacock', 'pelican', 'penguin', 'perch', 'pheasant', 'pig', 'pigeon', 'porcupine', 'quagga', 'rabbit', 'raccoon', 'rat', 'rattlesnake', 'rooster', 'seal', 'sheep', 'skunk', 'sloth', 'snail', 'snake', 'spider', 'tiger', 'whale', 'wolf', 'wombat', 'zebra'];

export {
    DEFAULT_QUERY_RETURN_LENGTH,
    MAX_QUERY_RETURN_LENGTH,
    DEFAULT_MIN_YEAR,
    DEFAULT_MAX_YEAR,
    DIFFICULTIES,
    CATEGORIES,
    // SUBCATEGORIES, // not used
    SUBCATEGORIES_FLATTENED,
    PERMANENT_ROOMS,
    COOKIE_MAX_AGE,
    WEBSOCKET_MAX_PAYLOAD,
    ADJECTIVES,
    ANIMALS,
};
