

const DIFFICULTIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const CATEGORIES = ['Literature', 'History', 'Science', 'Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
const SUBCATEGORIES = [
    ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
    ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
    ['Biology', 'Chemistry', 'Physics', 'Math', 'Other Science'],
    ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
    ['Religion'],
    ['Mythology'],
    ['Philosophy'],
    ['Social Science'],
    ['Current Events'],
    ['Geography'],
    ['Other Academic'],
    ['Trash']
];
const SUBCATEGORIES_FLATTENED = ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature', 'American History', 'Ancient History', 'European History', 'World History', 'Other History', 'Biology', 'Chemistry', 'Physics', 'Math', 'Other Science', 'Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];
/**
 * Subcategories flattened, but also includes the 4 optional subcategories
 * "Long Fiction", "Short Fiction", "Poetry", and "Drama".
 */
const SUBCATEGORIES_FLATTENED_ALL = ['Long Fiction', 'Short Fiction', 'Poetry', 'Drama', 'American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature', 'American History', 'Ancient History', 'European History', 'World History', 'Other History', 'Biology', 'Chemistry', 'Physics', 'Math', 'Other Science', 'Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts', 'Religion', 'Mythology', 'Philosophy', 'Social Science', 'Current Events', 'Geography', 'Other Academic', 'Trash'];

module.exports = { DIFFICULTIES, CATEGORIES, SUBCATEGORIES, SUBCATEGORIES_FLATTENED, SUBCATEGORIES_FLATTENED_ALL };
