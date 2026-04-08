import validateArray from './array.js';
import {
  ALTERNATE_SUBCATEGORIES,
  ALTERNATE_SUBCATEGORY_TO_CATEGORY,
  CATEGORIES,
  CATEGORY_TO_SUBCATEGORY,
  SUBCATEGORIES,
  SUBCATEGORY_TO_CATEGORY,
  CATEGORY_TO_ALTERNATE_SUBCATEGORIES
} from '../../quizbowl/categories.js';

// eslint-disable-next-line no-unused-vars
import express from 'express';

function validateCategories (object) {
  return validateArray(object, 'categories', { allowedValues: CATEGORIES, defaultValues: [] });
}

function validateSubcategories (object) {
  return validateArray(object, 'subcategories', { allowedValues: SUBCATEGORIES, defaultValues: [] });
}

function validateAlternateSubcategories (object) {
  return validateArray(object, 'alternateSubcategories', { allowedValues: ALTERNATE_SUBCATEGORIES, defaultValues: [] });
}

function addMissingCategories (object) {
  for (const subcategory of object.subcategories) {
    const category = SUBCATEGORY_TO_CATEGORY[subcategory];
    if (!object.categories.includes(category)) {
      object.categories.push(category);
    }
  }
  for (const alternateSubcategory of object.alternateSubcategories) {
    const category = ALTERNATE_SUBCATEGORY_TO_CATEGORY[alternateSubcategory];
    if (!object.categories.includes(category)) {
      object.categories.push(category);
    }
  }
  return object;
}

function addMissingSubcategories (object) {
  for (const category of object.categories) {
    let containsNoSubcategory = true;
    for (const subcategory of CATEGORY_TO_SUBCATEGORY[category]) {
      if (object.subcategories.includes(subcategory)) {
        containsNoSubcategory = false;
        break;
      }
    }
    if (containsNoSubcategory) {
      object.subcategories = object.subcategories.concat(CATEGORY_TO_SUBCATEGORY[category]);
    }
  }
  return object;
}

function addMissingAlternateSubcategories (object) {
  for (const category of object.categories) {
    let containsNoAlternateSubcategory = true;
    for (const alternateSubcategory of CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category]) {
      if (object.alternateSubcategories.includes(alternateSubcategory)) {
        containsNoAlternateSubcategory = false;
        break;
      }
    }
    if (containsNoAlternateSubcategory) {
      object.alternateSubcategories = object.alternateSubcategories.concat(CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category]);
    }
  }
  return object;
}

/**
 * Validates that the categories, subcategories, and alternate subcategories in the request are valid,
 * and ensures that they are logically consistent with each other.
 * @param {express.Request} object
 */
export default function validateCategoryBundle (object) {
  object = validateCategories(object);
  object = validateSubcategories(object);
  object = validateAlternateSubcategories(object);

  if (
    object.categories.length === 0 &&
    object.subcategories.length === 0 &&
    object.alternateSubcategories.length === 0
  ) {
    object.categories = CATEGORIES;
    object.subcategories = SUBCATEGORIES;
    object.alternateSubcategories = ALTERNATE_SUBCATEGORIES;
  }

  object = addMissingCategories(object);
  object = addMissingSubcategories(object);
  object = addMissingAlternateSubcategories(object);
  return object;
}
