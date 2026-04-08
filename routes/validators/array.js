/**
 * @template T
 * @param {object} object
 * @param {function(string): T} [mapper] - An optional function to map string values from the request to the type T
 * @returns {{
 *   [field]: T[]
 * }} A new object with the specified field validated and transformed into an array of type T
 */
export default function validateArray (object, field, { allowedValues, defaultValues }, mapper = x => x) {
  const arrayField = object[field];

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

  object[field] = getFieldValue(arrayField);
  return object;
}
