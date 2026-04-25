import { DEFAULT_MAX_YEAR, DEFAULT_MIN_YEAR, DIFFICULTIES } from '../../../quizbowl/constants.js';
import { CATEGORY_TO_SUBCATEGORY, CATEGORY_TO_ALTERNATE_SUBCATEGORIES } from '../../../quizbowl/categories.js';

function removeRedundantCategories (params) {
  let { categories, subcategories, alternateSubcategories } = params;
  if (!categories || !subcategories || !alternateSubcategories) { return params; }

  for (const category of categories) {
    let containsEverySubcategory = true;
    for (const subcategory of CATEGORY_TO_SUBCATEGORY[category]) {
      if (!subcategories || !subcategories.includes(subcategory)) {
        containsEverySubcategory = false;
        break;
      }
    }
    if (containsEverySubcategory) {
      subcategories = subcategories.filter(subcategory => !CATEGORY_TO_SUBCATEGORY[category].includes(subcategory));
    }

    let containsEveryAlternateSubcategory = true;
    for (const alternateSubcategory of CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category]) {
      if (!alternateSubcategories || !alternateSubcategories.includes(alternateSubcategory)) {
        containsEveryAlternateSubcategory = false;
        break;
      }
    }
    if (containsEveryAlternateSubcategory) {
      alternateSubcategories = alternateSubcategories.filter(alternateSubcategory => !CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category].includes(alternateSubcategory));
    }
  }

  return { ...params, subcategories, alternateSubcategories };
}

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
  params = removeRedundantCategories(params);
  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) => {
      if (value === '' || value === null || value === undefined) { return false; }
      if (value === false) { return false; }
      if (Array.isArray(value) && value.length === 0) { return false; }
      if (
        Array.isArray(value) &&
        key === 'difficulties' &&
        value.length === DIFFICULTIES.length &&
        DIFFICULTIES.every(d => value.includes(d))
      ) { return false; }
      if (key === 'minYear' && value === DEFAULT_MIN_YEAR) { return false; }
      if (key === 'maxYear' && value === DEFAULT_MAX_YEAR) { return false; }
      if (key === 'questionType' && value === 'all') { return false; }
      if (key === 'searchType' && value === 'all') { return false; }
      return true;
    })
  );
}
