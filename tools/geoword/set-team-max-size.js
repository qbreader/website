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
  .option('max-size', {
    description: 'the most players a team may have; omit to remove the cap',
    type: 'number'
  })
  .check(argv => argv['max-size'] === undefined || (Number.isInteger(argv['max-size']) && argv['max-size'] >= 1) || 'max-size must be a whole number, 1 or more')
  .epilog(`Examples:
  node tools/geoword/set-team-max-size.js -s september --max-size 4
      Cap teams in the "september" set at 4 players
  node tools/geoword/set-team-max-size.js -s september
      Remove the cap

This writes to whatever MONGODB_URI points at. Teams already over a new cap keep their members.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}"`);

const maxSize = argv['max-size'];
const update = maxSize === undefined ? { $unset: { 'teams.maxSize': '' } } : { $set: { 'teams.maxSize': maxSize } };
const { matchedCount } = await sets.updateOne({ name: argv.set }, update);
if (matchedCount === 0) {
  throw new Error(`Set "${argv.set}" does not exist.`);
}

console.log(maxSize === undefined ? `Teams in "${argv.set}" no longer have a size cap.` : `Teams in "${argv.set}" are now capped at ${maxSize} players.`);

await mongoClient.close();
