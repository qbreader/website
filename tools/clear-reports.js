import { closeConnection } from '../database/databases.js';
import { bonuses, tossups } from '../database/qbreader/collections.js';

import yargs from 'yargs/yargs';

export default async function clearReports (performUpdates = false) {
  if (performUpdates) {
    console.log(await tossups.updateMany(
      { reports: { $exists: true } },
      { $unset: { reports: '' } }
    ));

    console.log(await bonuses.updateMany(
      { reports: { $exists: true } },
      { $unset: { reports: '' } }
    ));
  } else {
    const tossupCount = await tossups.countDocuments({ reports: { $exists: true } });
    const bonusCount = await bonuses.countDocuments({ reports: { $exists: true } });
    console.log(`[DRY RUN]: Would clear reports from ${tossupCount} tossups and ${bonusCount} bonuses`);
  }
}

// user needs to pass the --confirm flag to actually run the script, otherwise it just prints what it would do
const argv = yargs(process.argv.slice(2))
  .option('confirm', {
    alias: 'c',
    type: 'boolean',
    description: 'Confirm that you want to clear all reports'
  })
  .help()
  .alias('help', 'h')
  .argv;

await clearReports(argv.confirm);
await closeConnection();
