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
 * @returns {Number} The number of points scored on a tossup.
 */
function scoreTossup({ isCorrect, inPower, endOfQuestion, isPace = false }) {
    const powerValue = isPace ? 20 : 15;
    const negValue = isPace ? 0 : -5;
    return isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);
}

module.exports = { DIFFICULTIES, CATEGORIES, SUBCATEGORIES, SUBCATEGORIES_FLATTENED, scoreTossup };
