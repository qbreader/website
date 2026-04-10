/**
 * Command-line tool that logs questions where the alternate_subcategory
 * is inconsistent with their category, using CATEGORY_TO_ALTERNATE_SUBCATEGORIES
 * from quizbowl/categories.js.
 *
 * A question is inconsistent if:
 *   - The category's alternate subcategory list is non-empty AND
 *     the question's alternate_subcategory is null/undefined OR not in that list, OR
 *   - The category's alternate subcategory list is non-empty AND
 *     the question's alternate_subcategory is set to a value that belongs to a different category.
 *
 * null/undefined is only valid when the category's alternate subcategory array has length zero.
 */

import { tossups, bonuses } from '../database/qbreader/collections.js';
import { CATEGORY_TO_ALTERNATE_SUBCATEGORIES } from '../quizbowl/categories.js';
import { mongoClient } from '../database/databases.js';

let inconsistentCount = 0;

/**
 * Check a single question and log it if inconsistent.
 * @param {object} question
 * @param {'tossup'|'bonus'} type
 */
function checkQuestion (question, type) {
  const { _id, category, alternate_subcategory: alternateSubcategory, setName, packetNumber, questionNumber } = question;
  const validAlternateSubcategories = CATEGORY_TO_ALTERNATE_SUBCATEGORIES[category];

  if (validAlternateSubcategories === undefined) {
    // Category not found in the mapping at all - skip
    return;
  }

  const hasAlternateSubcategories = validAlternateSubcategories.length > 0;

  let isInconsistent = false;

  if (hasAlternateSubcategories) {
    // null/undefined is NOT valid when the array is non-empty
    if (alternateSubcategory === null || alternateSubcategory === undefined) {
      isInconsistent = true;
    } else if (!validAlternateSubcategories.includes(alternateSubcategory)) {
      isInconsistent = true;
    }
  } else {
    // Empty array: only null/undefined is valid; any set value is wrong
    if (alternateSubcategory !== null && alternateSubcategory !== undefined) {
      isInconsistent = true;
    }
  }

  if (isInconsistent) {
    inconsistentCount++;
    console.log(`[${type}] _id=${_id} set="${setName}" packet=${packetNumber} question=${questionNumber} category="${category}" alternate_subcategory=${JSON.stringify(alternateSubcategory)}`);
  }
}

const projection = { _id: 1, category: 1, alternate_subcategory: 1, setName: 1, packetNumber: 1, questionNumber: 1 };

console.log('Checking tossups...');
const tossupCursor = tossups.find({}, { projection });
for await (const tossup of tossupCursor) {
  checkQuestion(tossup, 'tossup');
}

console.log('Checking bonuses...');
const bonusCursor = bonuses.find({}, { projection });
for await (const bonus of bonusCursor) {
  checkQuestion(bonus, 'bonus');
}

console.log(`\nDone. Found ${inconsistentCount} inconsistent question(s).`);

await mongoClient.close();
