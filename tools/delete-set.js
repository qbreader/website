import { perBonusData, perTossupData } from '../database/account-info/collections.js';
import { bonuses, tossups, packets, sets } from '../database/qbreader/collections.js';

import yargs from 'yargs/yargs';

export default async function deleteSet (name) {
  const result = await sets.findOneAndDelete({ name });
  if (!result) {
    console.log('Set not found');
    return;
  }
  const { _id } = result;

  console.log(await tossups.deleteMany({ 'set._id': _id }));
  console.log(await bonuses.deleteMany({ 'set._id': _id }));
  console.log(await packets.deleteMany({ 'set._id': _id }));
  console.log(await perTossupData.deleteMany({ set_id: _id }));
  console.log(await perBonusData.deleteMany({ set_id: _id }));
}

const argv = yargs(process.argv.slice(2))
  .command(
    '$0 <setName>',
    'Delete a set and all associated data',
    (yargs) =>
      yargs.positional('setName', {
        description: 'the name of the set to delete',
        type: 'string'
      })
  )
  .help()
  .alias('help', 'h')
  .argv;

await deleteSet(argv.setName);
