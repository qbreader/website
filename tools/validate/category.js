import { bonuses, tossups } from '../../database/qbreader/collections.js';
import { CATEGORIES } from '../../quizbowl/categories.js';

export default async function categoryValidation () {
  let total = 0;

  for (const [collectionName, collection] of [['Tossup', tossups], ['Bonus', bonuses]]) {
    for (const q of await collection.find({ category: { $not: { $in: CATEGORIES } } }).toArray()) {
      console.log(`${collectionName} ${q._id} has ${q.category} category, which is not in the list of valid categories.`);
      total++;
    }
  }

  return total;
}
