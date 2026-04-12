import { perBonusData, perTossupData, bonusStars, tossupStars, users } from '../database/account-info/collections.js';

import yargs from 'yargs/yargs';

async function deleteUser (_id) {
  const { deletedCount } = await users.deleteOne({ _id });
  if (deletedCount === 0) {
    console.log(`No user with _id ${_id} found.`);
    return;
  } else {
    console.log(deletedCount, 'user(s) deleted.');
  }
  console.log(await perTossupData.deleteMany(
    { 'data.user_id': _id },
    { $pull: { data: { user_id: _id } } }
  ));
  console.log(await perBonusData.deleteMany(
    { 'data.user_id': _id },
    { $pull: { data: { user_id: _id } } }
  ));
  console.log(await tossupStars.deleteMany({ user_id: _id }));
  console.log(await bonusStars.deleteMany({ user_id: _id }));
}

const argv = yargs(process.argv.slice(2))
  .command(
    '$0 <userId>',
    'Delete a user and all associated data',
    (yargs) =>
      yargs.positional('userId', {
        description: 'the _id of the user to delete',
        type: 'string'
      })
  )
  .help()
  .alias('help', 'h')
  .argv;

await deleteUser(argv.userId);
