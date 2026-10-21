import { buzzes } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('dry-run', {
    description: 'only report duplicate buzzes; do not create the index',
    type: 'boolean',
    default: false
  })
  .epilog(`Examples:
  node tools/geoword/add-buzz-unique-index.js --dry-run
      List players who have more than one buzz for the same question
  node tools/geoword/add-buzz-unique-index.js
      Create the unique index on buzzes (user, packet name, question number)

The index makes a second buzz for the same question fail instead of being saved,
so run it only after any duplicates found by --dry-run have been dealt with.
This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}"`);

const duplicates = await buzzes.aggregate([
  { $group: { _id: { user_id: '$user_id', packet: '$packet.name', questionNumber: '$questionNumber' }, count: { $sum: 1 }, buzzIds: { $push: '$_id' } } },
  { $match: { count: { $gt: 1 } } }
]).toArray();

if (duplicates.length > 0) {
  console.log(`Found ${duplicates.length} question(s) with more than one buzz:`);
  for (const { _id, count, buzzIds } of duplicates) {
    console.log(`  user ${_id.user_id}, packet "${_id.packet}", question ${_id.questionNumber}: ${count} buzzes (${buzzIds.join(', ')})`);
  }
  console.log('Delete the extra buzzes, then run this again.');
} else if (argv.dryRun) {
  console.log('No duplicate buzzes found.');
} else {
  const name = await buzzes.createIndex(
    { user_id: 1, 'packet.name': 1, questionNumber: 1 },
    { unique: true }
  );
  console.log(`Created index "${name}".`);
}

await mongoClient.close();
process.exitCode = duplicates.length > 0 ? 1 : 0;
