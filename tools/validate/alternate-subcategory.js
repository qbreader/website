import { bonuses, tossups } from '../../database/qbreader/collections.js';

const CATEGORY_TO_ALTERNATE_SUBCATEGORY = {
  Literature: [
    'Drama',
    'Long Fiction',
    'Poetry',
    'Short Fiction',
    'Misc Literature'
  ]
};

const ALTERNATE_SUBCATEGORY_LIST = Object.values(CATEGORY_TO_ALTERNATE_SUBCATEGORY).flat();

const SUBCATEGORY_TO_SUBSUBCATEGORY = {
  'Other Science': [
    'Math',
    'Astronomy',
    'Computer Science',
    'Earth Science',
    'Engineering',
    'Misc Science'
  ],
  'Other Fine Arts': [
    'Architecture',
    'Dance',
    'Film',
    'Jazz',
    'Opera',
    'Photography',
    'Musicals',
    'Misc Arts'
  ],
  'Social Science': [
    'Anthropology',
    'Economics',
    'Linguistics',
    'Psychology',
    'Sociology',
    'Other Social Science'
  ]
};

const SUBSUBCATEGORY_LIST = Object.values(SUBCATEGORY_TO_SUBSUBCATEGORY).flat();

export default async function alternateSubcategoryValidation () {
  let total = 0;

  for (const [collectionName, collection] of [['Tossup', tossups], ['Bonus', bonuses]]) {
    for (const q of await collection.find({ category: { $in: Object.keys(CATEGORY_TO_ALTERNATE_SUBCATEGORY) }, alternate_subcategory: null }).toArray()) {
      console.log(`${collectionName} ${q._id} has ${q.category} category and no alternate subcategory.`);
      total++;
    }
    for (const q of await collection.find({ subcategory: { $in: Object.keys(SUBCATEGORY_TO_SUBSUBCATEGORY) }, alternate_subcategory: null }).toArray()) {
      console.log(`${collectionName} ${q._id} has ${q.category} / ${q.subcategory} subcategory and no alternate subcategory.`);
      total++;
    }
    for (const q of await collection.find({ alternate_subcategory: { $not: { $in: ALTERNATE_SUBCATEGORY_LIST.concat(SUBSUBCATEGORY_LIST).concat(null) } } }).toArray()) {
      console.log(`${collectionName} ${q._id} has alternate subcategory ${q.alternate_subcategory}, which is not in the list of valid alternate subcategories.`);
      total++;
    }
    for (const [category, validAlternateSubcategories] of Object.entries(CATEGORY_TO_ALTERNATE_SUBCATEGORY)) {
      for (const q of await collection.find({ category, alternate_subcategory: { $not: { $in: validAlternateSubcategories } } }).toArray()) {
        console.log(`${collectionName} ${q._id} has category ${category} but alternate subcategory ${q.alternate_subcategory}, which is not valid for that category.`);
        total++;
      }
    }
    for (const [subcategory, validSubsubcategories] of Object.entries(SUBCATEGORY_TO_SUBSUBCATEGORY)) {
      for (const q of await collection.find({ subcategory, alternate_subcategory: { $not: { $in: validSubsubcategories } } }).toArray()) {
        console.log(`${collectionName} ${q._id} has subcategory ${subcategory} but alternate subcategory ${q.alternate_subcategory}, which is not valid for that subcategory.`);
        total++;
      }
    }
  }

  return total;
}
