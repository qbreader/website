// Deletes a Geoword packet: its tossups, their audio, the sample clip, its teams, and the packet itself.
//
// Refuses if anyone has played, picked a division, or paid, since deleting would orphan that data.
// --force deletes buzzes and division choices anyway (test data, mostly), but payments are never
// deleted: a paid packet has to be dealt with by hand.
// The special user (e.g. soundtracks-admin-prod) is left alone; it may be shared across packets.
import { audio, buzzes, divisionChoices, packets, payments, sampleAudio, teams, tossups } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <name> [options]')
  .command('$0 <name>', 'delete a Geoword packet', yargs => yargs
    .positional('name', {
      description: 'the packet name',
      type: 'string'
    }))
  .option('force', {
    description: "also delete the packet's buzzes and division choices (never payments)",
    type: 'boolean',
    default: false
  })
  .option('dryRun', {
    description: 'print what would be deleted without deleting anything',
    type: 'boolean',
    default: false
  })
  .epilog(`Examples:
  node tools/geoword/delete-packet.js soundtracks
      Delete a packet nobody has played or paid for
  node tools/geoword/delete-packet.js soundtracks --force
      Delete a packet along with its buzzes and division choices
  node tools/geoword/delete-packet.js soundtracks --dry-run
      Show what would be deleted

This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

const PACKET_NAME = argv.name;
const filter = { 'packet.name': PACKET_NAME };

console.log(`Target database: "${geoword.databaseName}", packet "${PACKET_NAME}"`);

const packet = await packets.findOne({ name: PACKET_NAME });
if (!packet) {
  throw new Error(`Packet "${PACKET_NAME}" does not exist.`);
}

const paymentCount = await payments.countDocuments(filter);
if (paymentCount > 0) {
  throw new Error(`Refusing to delete "${PACKET_NAME}": it has ${paymentCount} payments, which this script never deletes.`);
}

const playerData = {
  buzzes: await buzzes.countDocuments(filter),
  'division choices': await divisionChoices.countDocuments(filter)
};
const used = Object.entries(playerData).filter(([, count]) => count > 0).map(([label, count]) => `${count} ${label}`);
if (used.length > 0 && !argv.force) {
  throw new Error(`Refusing to delete "${PACKET_NAME}": it has ${used.join(', ')}. Pass --force to delete those too.`);
}

const packetTossups = await tossups.find(filter, { projection: { audio_id: 1 } }).toArray();
const teamCount = await teams.countDocuments({ packetName: PACKET_NAME });

console.log(`Will delete ${packetTossups.length} tossups (and their audio), the sample clip, ${teamCount} teams${used.length > 0 ? `, ${used.join(', ')}` : ''}, and the packet.`);

if (argv.dryRun) {
  console.log('Dry run: nothing deleted.');
  await mongoClient.close();
  process.exit(0);
}

await audio.deleteMany({ _id: { $in: packetTossups.map(tossup => tossup.audio_id) } });
await sampleAudio.deleteOne({ _id: packet.sample_audio_id });
await tossups.deleteMany(filter);
await teams.deleteMany({ packetName: PACKET_NAME });
if (argv.force) {
  await buzzes.deleteMany(filter);
  await divisionChoices.deleteMany(filter);
}
await packets.deleteOne({ _id: packet._id });

console.log(`Deleted "${PACKET_NAME}".`);

await mongoClient.close();
