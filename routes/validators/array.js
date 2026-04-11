import { DIFFICULTIES } from '../../quizbowl/constants.js';

/**
 * @template T
 * @param {object} object
 * @param {string} field - The name of the field in the object to validate as an array
 * @param {{ allowedValues: T[], defaultValues: T[] }} options - An object containing the allowed values for the array and the default values to use if validation fails
 * @param {function(string): T} [mapper] - An optional function to map string values from the request to the type T
 * @returns {{ [field: string]: T[] }} A new object with the specified field validated and transformed into an array of type T
 */
export default function validateArray (object, field, { allowedValues, defaultValues }, mapper = x => x) {
  function getFieldValue (arrayField) {
    if (arrayField === undefined || arrayField === null) { return defaultValues; }
    if (arrayField === '') { return defaultValues; }
    if (typeof arrayField === 'string') { arrayField = arrayField.split(','); }
    if (!Array.isArray(arrayField)) { return defaultValues; }
    arrayField = arrayField.map(mapper);
    if (arrayField.some(c => typeof c !== typeof allowedValues[0])) { return defaultValues; }
    arrayField = arrayField.filter(c => allowedValues.includes(c));
    return arrayField;
  }

  object[field] = getFieldValue(object[field]);
  return object;
}

export function difficulties (object) {
  return validateArray(object, 'difficulties', { allowedValues: DIFFICULTIES, defaultValues: DIFFICULTIES }, x => parseInt(x));
}
