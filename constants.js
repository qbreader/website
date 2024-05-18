const DEFAULT_QUERY_RETURN_LENGTH = 25;
const MAX_QUERY_RETURN_LENGTH = 10000;

const DEFAULT_MIN_YEAR = 2010;
const DEFAULT_MAX_YEAR = 2024;

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CATEGORIES = ['Literature', 'History', 'Science', 'Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
const SUBCATEGORY_TO_CATEGORY = {
  'American Literature': 'Literature',
  'British Literature': 'Literature',
  'Classical Literature': 'Literature',
  'European Literature': 'Literature',
  'World Literature': 'Literature',
  'Other Literature': 'Literature',
  'American History': 'History',
  'Ancient History': 'History',
  'European History': 'History',
  'World History': 'History',
  'Other History': 'History',
  Biology: 'Science',
  Chemistry: 'Science',
  Physics: 'Science',
  'Other Science': 'Science',
  'Visual Fine Arts': 'Fine Arts',
  'Auditory Fine Arts': 'Fine Arts',
  'Other Fine Arts': 'Fine Arts',
  Religion: 'Religion',
  Mythology: 'Mythology',
  Philosophy: 'Philosophy',
  'Social Science': 'Social Science',
  'Current Events': 'Current Events',
  Geography: 'Geography',
  'Other Academic': 'Other Academic',
  Trash: 'Trash'
};
const SUBCATEGORIES_FLATTENED = Object.keys(SUBCATEGORY_TO_CATEGORY);

const ALTERNATE_SUBCATEGORY_TO_CATEGORY = {
  Drama: 'Literature',
  'Long Fiction': 'Literature',
  Poetry: 'Literature',
  'Short Fiction': 'Literature',
  'Misc Literature': 'Literature',
  Math: 'Science',
  Astronomy: 'Science',
  'Computer Science': 'Science',
  'Earth Science': 'Science',
  Engineering: 'Science',
  'Misc Science': 'Science',
  Architecture: 'Fine Arts',
  Dance: 'Fine Arts',
  Film: 'Fine Arts',
  Jazz: 'Fine Arts',
  Opera: 'Fine Arts',
  Photography: 'Fine Arts',
  'Misc Arts': 'Fine Arts',
  Anthropology: 'Social Science',
  Economics: 'Social Science',
  Linguistics: 'Social Science',
  Psychology: 'Social Science',
  Sociology: 'Social Science',
  'Other Social Science': 'Social Science'
};
const ALTERNATE_SUBCATEGORIES_FLATTENED = Object.keys(ALTERNATE_SUBCATEGORY_TO_CATEGORY);

/**
 * List of multiplayer permanent room names.
 */
const PERMANENT_ROOMS = [
  {
    name: 'hsquizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES_FLATTENED
  },
  {
    name: 'collegequizbowl',
    categories: CATEGORIES,
    subcategories: SUBCATEGORIES_FLATTENED
  },
  {
    name: 'literature',
    categories: ['Literature'],
    subcategories: ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature']
  },
  {
    name: 'history',
    categories: ['History'],
    subcategories: ['American History', 'Ancient History', 'European History', 'World History', 'Other History']
  },
  {
    name: 'science',
    categories: ['Science'],
    subcategories: ['Biology', 'Chemistry', 'Physics', 'Other Science']
  },
  {
    name: 'fine-arts',
    categories: ['Fine Arts'],
    subcategories: ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts']
  },
  {
    name: 'trash',
    categories: ['Trash'],
    subcategories: ['Trash']
  }
];

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days
const ROOM_NAME_MAX_LENGTH = 32;
const USERNAME_MAX_LENGTH = 32;
const WEBSOCKET_MAX_PAYLOAD = 1024 * 10 * 1; // 10 KB

const ADJECTIVES = ['adaptable', 'adept', 'affectionate', 'agreeable', 'alluring', 'amazing', 'ambitious', 'amiable', 'ample', 'approachable', 'awesome', 'blithesome', 'bountiful', 'brave', 'breathtaking', 'bright', 'brilliant', 'capable', 'captivating', 'charming', 'competitive', 'confident', 'considerate', 'courageous', 'creative', 'dazzling', 'determined', 'devoted', 'diligent', 'diplomatic', 'dynamic', 'educated', 'efficient', 'elegant', 'enchanting', 'energetic', 'engaging', 'excellent', 'fabulous', 'faithful', 'fantastic', 'favorable', 'fearless', 'flexible', 'focused', 'fortuitous', 'frank', 'friendly', 'funny', 'generous', 'giving', 'gleaming', 'glimmering', 'glistening', 'glittering', 'glowing', 'gorgeous', 'gregarious', 'gripping', 'hardworking', 'helpful', 'hilarious', 'honest', 'humorous', 'imaginative', 'incredible', 'independent', 'inquisitive', 'insightful', 'kind', 'knowledgeable', 'likable', 'lovely', 'loving', 'loyal', 'lustrous', 'magnificent', 'marvelous', 'mirthful', 'moving', 'nice', 'optimistic', 'organized', 'outstanding', 'passionate', 'patient', 'perfect', 'persistent', 'personable', 'philosophical', 'plucky', 'polite', 'powerful', 'productive', 'proficient', 'propitious', 'qualified', 'ravishing', 'relaxed', 'remarkable', 'resourceful', 'responsible', 'romantic', 'rousing', 'sensible', 'shimmering', 'shining', 'sincere', 'sleek', 'sparkling', 'spectacular', 'spellbinding', 'splendid', 'stellar', 'stunning', 'stupendous', 'super', 'technological', 'thoughtful', 'twinkling', 'unique', 'upbeat', 'vibrant', 'vivacious', 'vivid', 'warmhearted', 'willing', 'wondrous', 'zestful'];
const ANIMALS = ['aardvark', 'alligator', 'alpaca', 'anaconda', 'ant', 'anteater', 'antelope', 'aphid', 'armadillo', 'baboon', 'badger', 'barracuda', 'bat', 'beaver', 'bedbug', 'bee', 'bird', 'bison', 'bobcat', 'buffalo', 'butterfly', 'buzzard', 'camel', 'carp', 'cat', 'caterpillar', 'catfish', 'cheetah', 'chicken', 'chimpanzee', 'chipmunk', 'cobra', 'cod', 'condor', 'cougar', 'cow', 'coyote', 'crab', 'cricket', 'crocodile', 'crow', 'cuckoo', 'deer', 'dinosaur', 'dog', 'dolphin', 'donkey', 'dove', 'dragonfly', 'duck', 'eagle', 'eel', 'elephant', 'emu', 'falcon', 'ferret', 'finch', 'fish', 'flamingo', 'flea', 'fly', 'fox', 'frog', 'goat', 'goose', 'gopher', 'gorilla', 'hamster', 'hare', 'hawk', 'hippopotamus', 'horse', 'hummingbird', 'husky', 'iguana', 'impala', 'kangaroo', 'lemur', 'leopard', 'lion', 'lizard', 'llama', 'lobster', 'margay', 'monkey', 'moose', 'mosquito', 'moth', 'mouse', 'mule', 'octopus', 'orca', 'ostrich', 'otter', 'owl', 'ox', 'oyster', 'panda', 'parrot', 'peacock', 'pelican', 'penguin', 'perch', 'pheasant', 'pig', 'pigeon', 'porcupine', 'quagga', 'rabbit', 'raccoon', 'rat', 'rattlesnake', 'rooster', 'seal', 'sheep', 'skunk', 'sloth', 'snail', 'snake', 'spider', 'tiger', 'whale', 'wolf', 'wombat', 'zebra'];

const QBREADER_EMAIL_ADDRESS = 'noreply@qbreader.org';

export {
  DEFAULT_QUERY_RETURN_LENGTH,
  MAX_QUERY_RETURN_LENGTH,
  DEFAULT_MIN_YEAR,
  DEFAULT_MAX_YEAR,
  DIFFICULTIES,
  CATEGORIES,
  SUBCATEGORY_TO_CATEGORY,
  ALTERNATE_SUBCATEGORY_TO_CATEGORY,
  ALTERNATE_SUBCATEGORIES_FLATTENED,
  SUBCATEGORIES_FLATTENED,
  PERMANENT_ROOMS,
  COOKIE_MAX_AGE,
  ROOM_NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  WEBSOCKET_MAX_PAYLOAD,
  ADJECTIVES,
  ANIMALS,
  QBREADER_EMAIL_ADDRESS
};
