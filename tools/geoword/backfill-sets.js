// One-time migration: puts every packet that existed before sets in its set, creating the sets
// that don't exist yet. Packets already in the right set are left alone, so it is safe to re-run.
// Packets not listed in SETS (e.g. ones added since) are reported and untouched; place those with
// set-packet-set.js.
import { packets, sets } from '../../database/geoword/collections.js';
import putPacketsInSet from '../../database/geoword/put-packets-in-set.js';
import { geoword, mongoClient } from '../../database/databases.js';

import { ObjectId } from 'mongodb';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const SETS = {
  'first-folio': ['opus-1', 'opus-2', 'opus-3', 'opus-4', 'opus-5', 'opus-6'],
  'second-folio': ['opus-7', 'opus-8', 'opus-9', 'opus-10'].flatMap(opus => [`${opus}-division-1`, `${opus}-division-2`]),
  'geoword-samples': ['beterword-sample', 'division-1-sample', 'division-2-sample', 'high-school-sample'],
  'community-packet': ['community-packet'],
  geojazz: ['geojazz'],
  '2025-nfl-season-special': ['2025 NFL Season Special']
};

const argv = yargs(hideBin(process.argv))
  .option('dryRun', {
    description: 'print what would change without writing anything (sets are not created either)',
    type: 'boolean',
    default: false
  })
  .epilog('This writes to whatever MONGODB_URI points at.')
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}"`);

for (const [name, packetNames] of Object.entries(SETS)) {
  const existing = await sets.findOne({ name });
  const set = existing ?? (argv.dryRun
    ? { _id: new ObjectId(), name }
    : (await sets.findOneAndUpdate({ name }, { $setOnInsert: { name } }, { upsert: true, returnDocument: 'after' })));
  console.log(`\n${set.name}${existing ? '' : ' (new set)'}: ${packetNames.join(', ')}`);
  console.log(await putPacketsInSet({ set: { _id: set._id, name: set.name }, packetNames, dryRun: argv.dryRun }));
}

const listed = new Set(Object.values(SETS).flat());
const unplaced = (await packets.find({}, { projection: { name: 1 } }).toArray()).map(packet => packet.name).filter(name => !listed.has(name));
if (unplaced.length > 0) {
  console.log(`\nNot in any set above, left untouched: ${unplaced.join(', ')}`);
}

await mongoClient.close();
