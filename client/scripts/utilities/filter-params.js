/**
 * Filters out unwanted key-value pairs from the given parameters object.
 *
 * The function removes entries based on the following conditions:
 * - The value is an empty string, `null`, or `undefined`.
 * - The value is `false`.
 * - The value is an empty array.
 * - The key is `questionType` or `searchType` and the value is `'all'`.
 *
 * @param {Object} params - The object containing key-value pairs to be filtered.
 * @returns {Object} A new object containing only the key-value pairs that pass the filtering criteria.
 */
export default function filterParams (params) {
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => {
      if (value === '' || value === null || value === undefined) { return false; }
      if (value === false) { return false; }
      if (Array.isArray(value) && value.length === 0) { return false; }
      if (key === 'questionType' && value === 'all') { return false; }
      if (key === 'searchType' && value === 'all') { return false; }
      return true;
    })
  );
}
