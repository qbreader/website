import { buzzes } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('dry-run', {
    description: 'print what would be deleted without deleting anything',
    type: 'boolean',
    default: false
  })
  .epilog(`Examples:
  node tools/geoword/dedupe-buzzes.js --dry-run
      Show the duplicate buzzes that would be deleted
  node tools/geoword/dedupe-buzzes.js
      Delete them, keeping each player's latest buzz for a question

A duplicate is more than one buzz by the same player for the same packet and question.
The latest is the one with the greatest _id. If a deleted buzz had a pending protest and
the one kept does not, the protest is carried over to the one kept.
Run tools/geoword/add-buzz-unique-index.js afterwards.
This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}"`);

const groups = await buzzes.aggregate([
  { $sort: { _id: 1 } },
  {
    $group: {
      _id: { user_id: '$user_id', packet: '$packet.name', questionNumber: '$questionNumber' },
      buzzes: { $push: { _id: '$_id', pendingProtest: '$pendingProtest' } }
    }
  },
  { $match: { 'buzzes.1': { $exists: true } } }
]).toArray();

let deleted = 0;
let protestsCarried = 0;

for (const { _id: key, buzzes: group } of groups) {
  const kept = group[group.length - 1];
  const removed = group.slice(0, -1);
  const carryProtest = kept.pendingProtest === undefined && removed.some(buzz => buzz.pendingProtest !== undefined);

  console.log(`user ${key.user_id}, packet "${key.packet}", question ${key.questionNumber}: keeping ${kept._id}, deleting ${removed.map(buzz => buzz._id).join(', ')}${carryProtest ? ' (carrying over a pending protest)' : ''}`);

  if (argv.dryRun) { continue; }

  if (carryProtest) {
    await buzzes.updateOne({ _id: kept._id }, { $set: { pendingProtest: true } });
    protestsCarried++;
  }
  const result = await buzzes.deleteMany({ _id: { $in: removed.map(buzz => buzz._id) } });
  deleted += result.deletedCount;
}

if (argv.dryRun) {
  console.log(`Dry run: ${groups.length} question(s) have duplicates; nothing was deleted.`);
} else {
  console.log(`Deleted ${deleted} duplicate buzz(es) across ${groups.length} question(s); carried over ${protestsCarried} protest(s).`);
}

await mongoClient.close();
