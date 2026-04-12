import { DEFAULT_QUERY_RETURN_LENGTH, MAX_QUERY_RETURN_LENGTH } from '../../constants.js';
import { DEFAULT_MAX_YEAR, DEFAULT_MIN_YEAR, MAX_YEAR, MIN_YEAR } from '../../quizbowl/constants.js';

/**
 * Validates that a field's value is an integer within specified bounds.
 * @param {Object} object - The object containing the field to validate.
 * @param {string} field - The name of the field to validate.
 * @param {{ defaultValue: number, lowerBound: number, upperBound: number }} options - An object containing the default value and bounds for the field.
 * @returns {{ [field: string]: number }} The updated object with the validated field.
 */
export default function validateInt (object, field, { defaultValue, lowerBound, upperBound }) {
  function getFieldValue (value) {
    if (value === undefined) { return defaultValue; }
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue)) { return defaultValue; }
    if (!isFinite(parsedValue)) { return defaultValue; }
    return parsedValue;
  }

  function clampValue (value) {
    if (lowerBound !== undefined && value < lowerBound) { return lowerBound; }
    if (upperBound !== undefined && value > upperBound) { return upperBound; }
    return value;
  }

  object[field] = clampValue(getFieldValue(object[field]));
  return object;
}

export function bonusPagination (object) {
  return validateInt(object, 'bonusPagination', { defaultValue: 1 });
}

export function limit (object) {
  return validateInt(object, 'limit', { defaultValue: 50, lowerBound: 1 });
}

export function maxReturnLength (object) {
  return validateInt(object, 'maxReturnLength', { defaultValue: DEFAULT_QUERY_RETURN_LENGTH, lowerBound: 1, upperBound: MAX_QUERY_RETURN_LENGTH });
}

export function maxYear (object) {
  return validateInt(object, 'maxYear', { defaultValue: DEFAULT_MAX_YEAR, lowerBound: MIN_YEAR, upperBound: MAX_YEAR });
}

export function minYear (object, defaultMinYear = DEFAULT_MIN_YEAR) {
  return validateInt(object, 'minYear', { defaultValue: defaultMinYear, lowerBound: MIN_YEAR, upperBound: MAX_YEAR });
}

export function number (object) {
  return validateInt(object, 'number', { defaultValue: 1, lowerBound: 1 });
}

export function tossupPagination (object) {
  return validateInt(object, 'tossupPagination', { defaultValue: 1, lowerBound: 1 });
}
