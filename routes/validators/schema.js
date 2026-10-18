import validateArray from './array.js';
import validateBoolean from './boolean.js';
import validateEnum from './enum.js';
import validateInt from './int.js';
import validateObjectId from './object-id.js';
import validateString from './string.js';

function toRule (validator, ...args) {
  return value => validator({ value }, 'value', ...args).value;
}

export const rules = {
  array: (options, mapper) => toRule(validateArray, options, mapper),
  boolean: (stringToCompareAgainst) => toRule(validateBoolean, stringToCompareAgainst),
  enum: (options) => toRule(validateEnum, options),
  int: (options) => toRule(validateInt, options),
  objectId: () => toRule(validateObjectId),
  string: (options) => toRule(validateString, options)
};

/**
 * Validates `input` against a schema that declares the entire shape of the expected input.
 * Only fields named in the schema appear in the result; anything else in `input` is dropped.
 * `input` is not mutated.
 *
 * @example
 * const query = validate(req.query, {
 *   difficulties: rules.array({ allowedValues: DIFFICULTIES, defaultValues: DIFFICULTIES }, x => parseInt(x)),
 *   limit: rules.int({ defaultValue: 50, lowerBound: 1 }),
 *   word: rules.string()
 * });
 *
 * @param {object} input - The raw input, such as `req.query`.
 * @param {{ [field: string]: function(any): any }} schema - Maps each field name to a rule.
 * @returns {object} A new object containing exactly the fields in the schema.
 */
export default function validate (input, schema) {
  const output = {};
  for (const [field, rule] of Object.entries(schema)) {
    output[field] = rule(input?.[field]);
  }
  return output;
}
