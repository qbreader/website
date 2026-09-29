// Re-tag the questions filed as World Language that are not language questions.
//
// A World Language question is the same expression written in French, German
// and Spanish, so its text always names all three. 43 of the 653 tagged that
// way in the archive are ordinary Language Arts questions -- Emerson, Dickens,
// subjunctive mood, Greek and Egyptian mythology, which the KSHSAA manual files
// under Language Arts along with literature and grammar.
//
// kshsaa-round.js already refuses to draw them into slot 1 by matching on the
// text, so a round is correct without this. This fixes the data itself, which
// also returns them to the Language Arts pool where they belong.
//
// It rewrites the per-question stats document as well as the question: those
// carry their own copy of category and subcategory, and the per-user stats
// aggregations group on them, so leaving them behind would silently split a
// player's Language Arts numbers across two categories.
//
// USAGE
//   node tools/retag-world-language.js            # report what it would change
//   node tools/retag-world-language.js --write    # apply
//
// Safe to re-run: it only touches questions that still match.

import { perTossupData } from '../database/account-info/collections.js';
import { tossups } from '../database/qbreader/collections.js';

import yargs from 'yargs/yargs';

// what the import script maps 'language arts' to
const TARGET = {
  kshsaa_category: 'Language Arts',
  category: 'Literature',
  subcategory: 'Other Literature',
  alternate_subcategory: null
};

const WORLD_LANGUAGE_TAG = { $regex: 'foreign language|world language', $options: 'i' };
const THREE_LANGUAGES = [
  { question: { $regex: 'FRENCH', $options: 'i' } },
  { question: { $regex: 'GERMAN', $options: 'i' } },
  { question: { $regex: 'SPANISH', $options: 'i' } }
];

const argv = yargs(process.argv.slice(2))
  .option('write', { type: 'boolean', default: false, description: 'apply the changes' })
  .option('show', { type: 'number', default: 8, description: 'how many to list' })
  .help()
  .argv;

// tagged World Language, but the text does not name all three languages
const misfiled = await tossups.find({
  kshsaaImport: true,
  kshsaa_category: WORLD_LANGUAGE_TAG,
  $nor: [{ $and: THREE_LANGUAGES }]
}, { projection: { question: 1, answer: 1, category: 1, subcategory: 1 } }).toArray();

console.log(argv.write ? 'WRITING to the database' : 'DRY RUN - nothing will be written (pass --write to apply)');
console.log();
console.log('tagged World Language            : ' +
  await tossups.countDocuments({ kshsaaImport: true, kshsaa_category: WORLD_LANGUAGE_TAG }));
console.log('  genuine three-language         : ' +
  await tossups.countDocuments({ kshsaaImport: true, kshsaa_category: WORLD_LANGUAGE_TAG, $and: THREE_LANGUAGES }));
console.log('  to be re-tagged Language Arts  : ' + misfiled.length);

if (!misfiled.length) {
  console.log('\nnothing to do');
  process.exit(0);
}

console.log('\nfirst ' + Math.min(argv.show, misfiled.length) + ':');
misfiled.slice(0, argv.show).forEach((t, i) => {
  console.log('  ' + (i + 1) + '. ' + t.question.replace(/\s+/g, ' ').slice(0, 96));
  console.log('     ' + t.category + '/' + t.subcategory + '  ->  ' + TARGET.category + '/' + TARGET.subcategory);
});

// how many carry recorded buzzes, which is what makes the stats copy matter
const ids = misfiled.map(t => t._id);
const played = await perTossupData.countDocuments({ _id: { $in: ids }, 'data.0': { $exists: true } });
console.log('\nstats documents to update        : ' +
  await perTossupData.countDocuments({ _id: { $in: ids } }) + ' (' + played + ' with recorded buzzes)');

if (!argv.write) {
  console.log('\npass --write to apply');
  process.exit(0);
}

const questionResult = await tossups.updateMany(
  { _id: { $in: ids } },
  { $set: { ...TARGET, updatedAt: new Date() } }
);
// keep the stats copies in step, minus the fields they do not carry
const statsResult = await perTossupData.updateMany(
  { _id: { $in: ids } },
  { $set: { category: TARGET.category, subcategory: TARGET.subcategory }, $unset: { alternate_subcategory: '' } }
);
console.log('\nquestions re-tagged              : ' + questionResult.modifiedCount);
console.log('stats documents updated          : ' + statsResult.modifiedCount);

const leftover = await tossups.countDocuments({
  kshsaaImport: true,
  kshsaa_category: WORLD_LANGUAGE_TAG,
  $nor: [{ $and: THREE_LANGUAGES }]
});
console.log('\nstill mis-tagged                 : ' + leftover + ' (expected 0)');
console.log('World Language pool now          : ' +
  await tossups.countDocuments({ kshsaaImport: true, kshsaa_category: WORLD_LANGUAGE_TAG }));
console.log('Language Arts pool now           : ' +
  await tossups.countDocuments({ kshsaaImport: true, category: 'Literature' }));
process.exit(0);
