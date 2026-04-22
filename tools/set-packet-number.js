import { closeConnection } from '../database/databases.js';
import { bonuses, packets, tossups } from '../database/qbreader/collections.js';

import yargs from 'yargs/yargs';

export default async function setPacketNumber (packetId, packetNumber) {
  const packet = await packets.findOneAndUpdate(
    { _id: packetId },
    { $set: { number: packetNumber } }
  );

  const tossupResult = await tossups.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': packet.name, 'packet.number': packetNumber } }
  );

  const bonusResult = await bonuses.updateMany(
    { 'packet._id': packet._id },
    { $set: { 'packet.name': packet.name, 'packet.number': packetNumber } }
  );

  return { tossupResult, bonusResult, packet };
}

const argv = yargs(process.argv.slice(2))
  .command(
    '$0 <packetId> <packetNumber>',
    'Update the packet number of a packet and all associated tossups and bonuses',
    (yargs) =>
      yargs
        .positional('packetId', {
          description: 'the ID of the packet to update',
          type: 'string'
        })
        .positional('packetNumber', {
          description: 'the new packet number',
          type: 'number'
        })
  )
  .help()
  .alias('help', 'h')
  .argv;

const { packetId, packetNumber } = argv;
const result = await setPacketNumber(packetId, packetNumber);
console.log(result);
await closeConnection();
