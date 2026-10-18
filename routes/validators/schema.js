import validateAlias from './alias.js';
import validateArray from './array.js';
import validateBoolean from './boolean.js';
import validateEnum from './enum.js';
import validateInt from './int.js';
import validateObjectId from './object-id.js';
import validateString from './string.js';

/**
 * Rules for use in a schema. Each one pairs the validator of the same name with its arguments, so the coercion, clamping, and defaulting behavior is identical.
 */
export const rules = {
  alias: (of) => ({ validator: validateAlias, args: [{ of }] }),
  array: (options, mapper) => ({ validator: validateArray, args: [options, mapper] }),
  boolean: (stringToCompareAgainst) => ({ validator: validateBoolean, args: [stringToCompareAgainst] }),
  enum: (options) => ({ validator: validateEnum, args: [options] }),
  int: (options) => ({ validator: validateInt, args: [options] }),
  objectId: () => ({ validator: validateObjectId, args: [] }),
  string: (options) => ({ validator: validateString, args: [options] })
};

/**
 * Validates `input` against a schema that declares the entire shape of the expected input.
 * Only fields named in the schema appear in the result; anything else in `input` is dropped.
 * `input` is not mutated. An alias entry, `rules.alias('target')`, accepts the target field
 * under another name.
 *
 * @example
 * const query = validate(req.query, {
 *   difficulties: rules.array({ allowedValues: DIFFICULTIES, defaultValues: DIFFICULTIES }, x => parseInt(x)),
 *   limit: rules.int({ defaultValue: 50, lowerBound: 1 }),
 *   queryString: rules.string(),
 *   q: rules.alias('queryString')
 * });
 *
 * @param {object} input - The raw input, such as `req.query`.
 * @param {{ [field: string]: { validator: Function, args: any[] } }} schema - Maps each field name to a rule or an alias.
 * @returns {object} A new object containing exactly the non-alias fields in the schema.
 */
export default function validate (input, schema) {
  const work = { ...input };

  for (const [field, { validator, args }] of Object.entries(schema)) {
    if (validator !== validateAlias) { continue; }
    const [{ of }] = args;
    if (!(of in schema)) { throw new Error(`Alias "${field}" targets "${of}", which is not in the schema`); }
    validateAlias(work, field, { of });
  }

  const output = {};
  for (const [field, { validator, args }] of Object.entries(schema)) {
    if (validator === validateAlias) { continue; }
    validator(work, field, ...args);
    output[field] = work[field];
  }
  return output;
}
