// Puts existing Geoword packets in a set, for data created before sets existed.
//
// See putPacketsInSet for what is written.
import { sets } from '../../database/geoword/collections.js';
import putPacketsInSet from '../../database/geoword/put-packets-in-set.js';
import { geoword, mongoClient } from '../../database/databases.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('set', {
    alias: 's',
    description: 'the name of the set; it must already exist in the sets collection',
    type: 'string',
    demandOption: true
  })
  .option('packet', {
    alias: 'p',
    description: 'a packet name to put in the set; pass it once per packet',
    type: 'string',
    array: true,
    demandOption: true
  })
  .option('dryRun', {
    description: 'print what would change without writing anything',
    type: 'boolean',
    default: false
  })
  .epilog(`Examples:
  node tools/geoword/set-packet-set.js -s september -p september-special
      Put one packet, and everything that references it, in the "september" set
  node tools/geoword/set-packet-set.js -s september -p a -p b --dry-run
      Show what would change for two packets

This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}", set "${argv.set}", packets ${argv.packet.map(name => `"${name}"`).join(', ')}`);

const found = await sets.findOne({ name: argv.set });
if (!found) {
  throw new Error(`Set "${argv.set}" does not exist in the sets collection.`);
}
const set = { _id: found._id, name: found.name };

const counts = await putPacketsInSet({ set, packetNames: argv.packet, dryRun: argv.dryRun });
console.log(counts);
console.log(argv.dryRun ? 'Dry run: nothing written.' : `Put ${argv.packet.length} packet(s) in "${set.name}".`);

await mongoClient.close();
