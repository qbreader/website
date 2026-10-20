/**
 * Makes the value of `object[field]` available as `object[of]` when `object[of]` is missing or empty.
 * `object[of]` wins if it has a value. `object[field]` is left untouched.
 * @param {object} object - The object containing the fields.
 * @param {string} field - The name of the alias field.
 * @param {{ of: string }} options - `of` is the name of the field that `field` is an alias for.
 * @returns {object} The updated object.
 */
export default function validateAlias (object, field, { of }) {
  if (!object[of] && object[field]) { object[of] = object[field]; }
  return object;
}
