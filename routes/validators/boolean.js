/**
 *
 * @param {object} object
 * @param {string} field - The name of the field in the object to validate as a boolean
 * @param {string} stringToCompareAgainst - The string value that will be compared against the value of object[field] to determine if it should be true or false. Defaults to 'true'.
 * @returns {{ [field: string]: boolean }} A new object with the specified field validated and transformed into a boolean
 */
export default function validateBoolean (object, field, stringToCompareAgainst = 'true') {
  object[field] = (object[field] === stringToCompareAgainst);
  return object;
}

export function caseSensitive (object) {
  return validateBoolean(object, 'caseSensitive');
}

export function exactPhrase (object) {
  return validateBoolean(object, 'exactPhrase');
}

export function ignoreWordOrder (object) {
  return validateBoolean(object, 'ignoreWordOrder');
}

export function modaq (object) {
  return validateBoolean(object, 'modaq');
}

export function powermarkOnly (object) {
  return validateBoolean(object, 'powermarkOnly');
}

export function randomize (object) {
  return validateBoolean(object, 'randomize');
}

export function regex (object) {
  return validateBoolean(object, 'regex');
}

export function standardOnly (object) {
  return validateBoolean(object, 'standardOnly');
}

export function threePartBonuses (object) {
  return validateBoolean(object, 'threePartBonuses');
}
