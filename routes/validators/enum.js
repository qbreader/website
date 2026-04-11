import { ALTERNATE_SUBCATEGORIES, CATEGORIES, SUBCATEGORIES } from '../../quizbowl/categories.js';

/**
 * Validates that a field's value is one of the allowed enum values.
 * @template T
 * @param {Object} object - The object containing the field to validate.
 * @param {string} field - The name of the field to validate.
 * @param {{ allowedValues: T[], defaultValue: T }} options - An object containing the allowed values for the field and the default value to use if validation fails.
 * @returns {{ [field: string]: T }} The updated object with the validated field.
 */
export default function validateEnum (object, field, { allowedValues, defaultValue }) {
  function getFieldValue (value) {
    if (value === undefined) { return defaultValue; }
    if (typeof value !== typeof allowedValues[0]) { return defaultValue; }
    if (!allowedValues.includes(value)) { return defaultValue; }
    return value;
  }

  object[field] = getFieldValue(object[field]);
  return object;
}

export function alternateSubcategory (object) {
  return validateEnum(object, 'alternateSubcategory', { allowedValues: ALTERNATE_SUBCATEGORIES, defaultValue: undefined });
}

export function category (object) {
  return validateEnum(object, 'category', { allowedValues: CATEGORIES, defaultValue: undefined });
}

export function questionType (object) {
  return validateEnum(object, 'questionType', { allowedValues: ['tossup', 'bonus', 'all'], defaultValue: 'all' });
}

export function searchType (object) {
  return validateEnum(object, 'searchType', { allowedValues: ['question', 'answer', 'exactAnswer', 'all'], defaultValue: 'all' });
}

export function subcategory (object) {
  return validateEnum(object, 'subcategory', { allowedValues: SUBCATEGORIES, defaultValue: undefined });
}
