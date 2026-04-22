import { closeConnection } from '../../database/databases.js';
import { packets } from '../../database/qbreader/collections.js';
import setPacketNumber from '../set-packet-number.js';

import yargs from 'yargs/yargs';

export default async function fixPacketNumbers (setName) {
  await packets.dropIndex('set.name_1_number_1');

  const results = await packets.find({ 'set.name': setName }).toArray();
  for (const packet of results) {
    const packetNumber = parseInt(packet.name);
    if (isNaN(packetNumber)) {
      console.log(`Skipping packet ${packet._id} with name ${packet.name}`);
      continue;
    }
    const { tossupResult, bonusResult } = await setPacketNumber(packet._id, packetNumber);
    console.log(`Updated packet ${packet._id} (${packet.name}) to number ${packetNumber}: ${tossupResult.modifiedCount} tossups and ${bonusResult.modifiedCount} bonuses.`);
  }

  await packets.createIndex({ 'set.name': 1, number: 1 }, { unique: true });
}

const argv = yargs(process.argv.slice(2))
  .command(
    '$0 <setName>',
    'Fix packet numbers for a set',
    (yargs) =>
      yargs.positional('setName', {
        description: 'the name of the set to fix packet numbers for',
        type: 'string'
      })
  )
  .help()
  .alias('help', 'h')
  .argv;

await fixPacketNumbers(argv.setName);
await closeConnection();
