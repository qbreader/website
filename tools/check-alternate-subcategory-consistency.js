/**
 * Command-line tool that logs questions where the alternate_subcategory
 * is inconsistent with their category, using CATEGORY_TO_ALTERNATE_SUBCATEGORIES
 * from quizbowl/categories.js.
 *
 * A question is inconsistent if:
 *   - The category's alternate subcategory list is non-empty AND
 *     the question's alternate_subcategory is null/undefined, OR
 *   - The category's alternate subcategory list is non-empty AND
 *     the question's alternate_subcategory is not in that list, OR
 *   - The category's alternate subcategory list is empty AND
 *     the question's alternate_subcategory is set to a non-null/undefined value.
 *
 * null/undefined is only valid when the category's alternate subcategory array has length zero.
 */

import { tossups, bonuses } from '../database/qbreader/collections.js';
import { CATEGORY_TO_ALTERNATE_SUBCATEGORIES } from '../quizbowl/categories.js';
import { mongoClient } from '../database/databases.js';

let inconsistentCount = 0;

/**
 * Build a MongoDB query that matches inconsistent alternate_subcategory values.
 * @returns {object}
 */
function getInconsistencyQuery () {
  const categoryQueries = [];
  for (const [category, validAlternateSubcategories] of Object.entries(CATEGORY_TO_ALTERNATE_SUBCATEGORIES)) {
    if (validAlternateSubcategories.length > 0) {
      categoryQueries.push({
        category,
        alternate_subcategory: { $nin: validAlternateSubcategories }
      });
    } else {
      categoryQueries.push({
        category,
        alternate_subcategory: { $exists: true, $ne: null }
      });
    }
  }

  return { $or: categoryQueries };
}

/**
 * Log each inconsistent question for a given collection.
 * @param {import('mongodb').Collection} collection
 * @param {'tossup'|'bonus'} type
 */
async function logInconsistentQuestions (collection, type) {
  const projection = { _id: 1, category: 1, alternate_subcategory: 1, setName: 1, packetNumber: 1, questionNumber: 1 };
  const inconsistencyQuery = getInconsistencyQuery();
  const cursor = collection.find(inconsistencyQuery, { projection });

  for await (const question of cursor) {
    const { _id, category, alternate_subcategory: alternateSubcategory, setName, packetNumber, questionNumber } = question;
    inconsistentCount++;
    console.log(`[${type}] _id=${_id} set="${setName}" packet=${packetNumber} question=${questionNumber} category="${category}" alternate_subcategory=${JSON.stringify(alternateSubcategory)}`);
  }
}

console.log('Checking tossups...');
await logInconsistentQuestions(tossups, 'tossup');

console.log('Checking bonuses...');
await logInconsistentQuestions(bonuses, 'bonus');

console.log(`\nDone. Found ${inconsistentCount} inconsistent question(s).`);

await mongoClient.close();
