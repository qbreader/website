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

const COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days
const WEBSOCKET_MAX_PAYLOAD = 1024 * 10 * 1; // 10 KB

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
  COOKIE_MAX_AGE,
  WEBSOCKET_MAX_PAYLOAD,
  QBREADER_EMAIL_ADDRESS
};
