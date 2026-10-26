// Sets `duration` on a Geoword packet's tossups from their stored audio, for packets uploaded before
// upload-packet.js recorded it. The results page needs it to place buzzes on a tossup's audio.
// Tossups that already have a duration are skipped unless --force is passed.
import { audio, tossups } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';
import getMp3Duration from './get-mp3-duration.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 <name> [options]')
  .command('$0 <name>', "set duration on a Geoword packet's tossups", yargs => yargs
    .positional('name', {
      description: 'the packet name',
      type: 'string'
    }))
  .option('force', {
    description: 'recompute the duration of tossups that already have one',
    type: 'boolean',
    default: false
  })
  .option('dryRun', {
    description: 'print the durations without saving them',
    type: 'boolean',
    default: false
  })
  .epilog(`Examples:
  node tools/geoword/backfill-durations.js soundtracks
      Set the duration of each tossup that has none
  node tools/geoword/backfill-durations.js soundtracks --dry-run
      Show the durations without saving them

This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

const PACKET_NAME = argv.name;

console.log(`Target database: "${geoword.databaseName}", packet "${PACKET_NAME}"`);

const packetTossups = await tossups.find(
  { 'packet.name': PACKET_NAME, ...(!argv.force && { duration: { $exists: false } }) },
  { projection: { audio_id: 1, division: 1, questionNumber: 1 }, sort: { division: 1, questionNumber: 1 } }
).toArray();

if (packetTossups.length === 0) {
  console.log('Nothing to do: every tossup already has a duration, or the packet has no tossups.');
}

for (const { _id, audio_id: audioId, division, questionNumber } of packetTossups) {
  const audioFile = await audio.findOne({ _id: audioId });
  const duration = getMp3Duration(audioFile.audio.buffer);

  if (!argv.dryRun) {
    await tossups.updateOne({ _id }, { $set: { duration } });
  }
  console.log(`${division} question ${questionNumber}: ${duration.toFixed(1)}s`);
}

console.log(argv.dryRun ? 'Dry run: nothing saved.' : `Set the duration of ${packetTossups.length} tossups.`);

await mongoClient.close();
