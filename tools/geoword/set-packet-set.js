// Puts existing Geoword packets in a set, for data created before sets existed.
//
// Writes `set: { _id, name }` onto each packet and every tossup, buzz, payment and division choice
// of those packets. Teams used to belong to a packet (`packetName`); they now belong to a set, so
// the packets' teams are moved to the set too, and `packetName` is removed.
// Idempotent: running it again is a no-op. Refuses to merge two teams into one when a set would
// end up with the same team name twice in a division.
import { buzzes, divisionChoices, packets, payments, sets, teams, tossups } from '../../database/geoword/collections.js';
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

for (const name of argv.packet) {
  const packet = await packets.findOne({ name });
  if (!packet) {
    throw new Error(`Packet "${name}" does not exist.`);
  }
  if (packet.set && String(packet.set._id) !== String(set._id)) {
    throw new Error(`Packet "${name}" is already in set "${packet.set.name}".`);
  }
}

// Teams to move: the packets' old per-packet teams, plus any already in the set.
const oldTeams = await teams.find({ packetName: { $in: argv.packet } }).toArray();
const seen = new Map();
for (const team of [...await teams.find({ 'set._id': set._id }).toArray(), ...oldTeams]) {
  const key = `${team.division}\u0000${team.teamName.toLowerCase()}`;
  if (seen.has(key) && String(seen.get(key)) !== String(team._id)) {
    throw new Error(`Two teams named "${team.teamName}" in division "${team.division}" would share set "${set.name}". Resolve them by hand first.`);
  }
  seen.set(key, team._id);
}

const filter = { 'packet.name': { $in: argv.packet } };
const collections = { tossups, buzzes, payments, 'division choices': divisionChoices };

for (const [label, collection] of Object.entries(collections)) {
  const count = await collection.countDocuments(filter);
  console.log(`${label}: ${count}`);
  if (!argv.dryRun) {
    await collection.updateMany(filter, { $set: { set } });
  }
}
console.log(`teams: ${oldTeams.length}`);

if (!argv.dryRun) {
  await packets.updateMany({ name: { $in: argv.packet } }, { $set: { set } });
  await teams.updateMany({ packetName: { $in: argv.packet } }, { $set: { set }, $unset: { packetName: '' } });
}

console.log(argv.dryRun ? 'Dry run: nothing written.' : `Put ${argv.packet.length} packet(s) in "${set.name}".`);

await mongoClient.close();
