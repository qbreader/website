import validateAlias from './alias.js';
import validateArray, * as arrayPresets from './array.js';
import validateBoolean, * as booleanPresets from './boolean.js';
import validateEnum, * as enumPresets from './enum.js';
import validateInt, * as intPresets from './int.js';
import validateObjectId, * as objectIdPresets from './object-id.js';
import validateString, * as stringPresets from './string.js';

/**
 * Turns the named exports of a validator module, such as `difficulties` in `array.js`, into rules.
 * A preset writes to a fixed field, so it must be declared under that same name in the schema.
 * @param {{ [name: string]: function(object): object }} presets
 * @returns {{ [name: string]: { validator: Function, args: [] } }}
 */
function toPresetRules (presets) {
  const presetRules = {};
  for (const [name, preset] of Object.entries(presets)) {
    if (name === 'default') { continue; }
    presetRules[name] = {
      validator: (object, field) => {
        if (field !== name) { throw new Error(`Preset rule "${name}" cannot be used for field "${field}"`); }
        return preset(object);
      },
      args: []
    };
  }
  return presetRules;
}

/**
 * Rules for use in a schema. Each one pairs the validator of the same name with its arguments, so the coercion, clamping, and defaulting behavior is identical.
 * Rules that have named validators also expose them as presets, e.g. `rules.array.difficulties`.
 */
export const rules = {
  alias: (of) => ({ validator: validateAlias, args: [{ of }] }),
  array: Object.assign((options, mapper) => ({ validator: validateArray, args: [options, mapper] }), toPresetRules(arrayPresets)),
  boolean: Object.assign((stringToCompareAgainst) => ({ validator: validateBoolean, args: [stringToCompareAgainst] }), toPresetRules(booleanPresets)),
  enum: Object.assign((options) => ({ validator: validateEnum, args: [options] }), toPresetRules(enumPresets)),
  int: Object.assign((options) => ({ validator: validateInt, args: [options] }), toPresetRules(intPresets)),
  objectId: Object.assign(() => ({ validator: validateObjectId, args: [] }), toPresetRules(objectIdPresets)),
  string: Object.assign((options) => ({ validator: validateString, args: [options] }), toPresetRules(stringPresets))
};

/**
 * Validates `input` against a schema that declares the entire shape of the expected input.
 * Only fields named in the schema appear in the result; anything else in `input` is dropped.
 * `input` is not mutated.
 *
 * An alias entry, `rules.alias('target')`, accepts the target field under another name.
 * The target's own name wins; the alias is used only when the target is missing or empty.
 * Aliases never appear in the result.
 *
 * @example
 * const query = validate(req.query, {
 *   difficulties: rules.array.difficulties,
 *   limit: rules.int.limit,
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
