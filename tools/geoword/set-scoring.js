// Changes the scoring scheme of a Geoword packet.
//
// Buzzes store their points, so this recomputes every existing buzz's points under the
// new scheme. Pass --no-rescore to change only the packet, which leaves buzzes already
// recorded scored under the old scheme.
import { buzzes, packets } from '../../database/geoword/collections.js';
import { geoword, mongoClient } from '../../database/databases.js';
import scoreBuzz, { SCORING_SCHEMES } from '../../shared/geoword-scoring.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('name', {
    alias: 'n',
    description: 'the packet name',
    type: 'string',
    demandOption: true
  })
  .option('scoring', {
    alias: 's',
    description: 'the scoring scheme: celerity is 10-20 points for a correct answer, neg5 is +10 / -5 (0 once the audio has ended)',
    choices: Object.keys(SCORING_SCHEMES),
    demandOption: true
  })
  .option('rescore', {
    description: "recompute the points of the packet's existing buzzes under the new scheme; --no-rescore skips this",
    type: 'boolean',
    default: true
  })
  .epilog(`Examples:
  node tools/geoword/set-scoring.js -n soundtracks -s neg5
      Switch a packet and re-score the buzzes already recorded
  node tools/geoword/set-scoring.js -n soundtracks -s neg5 --no-rescore
      Switch a packet and leave recorded buzzes as they are

This writes to whatever MONGODB_URI points at.`)
  .wrap(100)
  .help()
  .alias('help', 'h')
  .argv;

console.log(`Target database: "${geoword.databaseName}", packet "${argv.name}"`);

const packet = await packets.findOne({ name: argv.name });
if (!packet) {
  throw new Error(`Packet "${argv.name}" does not exist.`);
}

const current = packet.scoring ?? 'celerity (default)';
const buzzCount = await buzzes.countDocuments({ 'packet.name': argv.name });

if (buzzCount > 0 && !argv.rescore) {
  console.warn(`Warning: ${buzzCount} existing buzzes stay scored under ${current}.`);
}

if (argv.rescore && buzzCount > 0) {
  const operations = [];

  for await (const buzz of buzzes.find({ 'packet.name': argv.name })) {
    // Buzzes recorded before isCorrect existed were only ever positive when correct.
    const isCorrect = buzz.isCorrect ?? buzz.points > 0;
    operations.push({
      updateOne: {
        filter: { _id: buzz._id },
        update: { $set: { isCorrect, points: scoreBuzz(argv.scoring, { celerity: buzz.celerity, isCorrect }) } }
      }
    });
  }

  await buzzes.bulkWrite(operations);
  console.log(`Re-scored ${operations.length} buzzes.`);
}

await packets.updateOne({ _id: packet._id }, { $set: { scoring: argv.scoring } });
console.log(`"${argv.name}" scoring: ${current} -> ${argv.scoring}.`);

await mongoClient.close();
