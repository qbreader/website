// Opens or closes team registration for a Geoword set. Closing it blocks creating and joining teams;
// players already on a team keep access to theirs.
import { sets } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('set', {
    alias: 's',
    description: 'the set name, e.g. september',
    type: 'string',
    demandOption: true
  })
  .option('enabled', {
    description: 'whether team registration is open; --no-enabled closes it',
    type: 'boolean',
    default: true
  })
  .epilog(`Examples:
  node tools/geoword/set-teams-enabled.js -s september
      Open team registration for the "september" set
  node tools/geoword/set-teams-enabled.js -s september --no-enabled
      Close it

This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}"`);

const { matchedCount } = await sets.updateOne({ name: argv.set }, { $set: { teamsEnabled: argv.enabled } });
if (matchedCount === 0) {
  throw new Error(`Set "${argv.set}" does not exist.`);
}

console.log(`Team registration for "${argv.set}" is now ${argv.enabled ? 'open' : 'closed'}.`);

await mongoClient.close();
