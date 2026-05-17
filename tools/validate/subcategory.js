import { bonuses, tossups } from '../../database/qbreader/collections.js';
import { SUBCATEGORIES } from '../../quizbowl/categories.js';

export default async function subcategoryValidation () {
  let total = 0;

  for (const [collectionName, collection] of [['Tossup', tossups], ['Bonus', bonuses]]) {
    for (const q of await collection.find({ subcategory: { $not: { $in: SUBCATEGORIES } } }).toArray()) {
      console.log(`${collectionName} ${q._id} has ${q.category} / ${q.subcategory} subcategory, which is not in the list of valid subcategories.`);
      total++;
    }
  }

  return total;
}
