import { emailCollation, users } from '../database/account-info/collections.js';
import { closeConnection } from '../database/databases.js';

import yargs from 'yargs/yargs';

const INDEX_NAME = 'verified-email-unique';

/**
 * Find verified emails (compared case-insensitively) that more than one account has.
 * @returns {Promise<{ usernames: string[] }[]>} The accounts in each group of duplicates.
 */
async function findDuplicateVerifiedEmails () {
  return await users.aggregate([
    { $match: { verifiedEmail: true } },
    { $group: { _id: '$email', usernames: { $push: '$username' } } },
    { $match: { 'usernames.1': { $exists: true } } }
  ], { collation: emailCollation }).toArray();
}

/**
 * Create the case-insensitive unique index on verified emails.
 * It speeds up logging in with an email, and guarantees that a verified email identifies one account.
 * Refuses to run while duplicates exist, since the index could not be built.
 * @param {boolean} apply - If false, only report the duplicates and do not touch the database.
 */
async function createUserIndexes (apply) {
  const duplicates = await findDuplicateVerifiedEmails();

  if (duplicates.length > 0) {
    console.log(`${duplicates.length} verified email(s) are shared by more than one account:`);
    for (const { usernames } of duplicates) {
      console.log(' ', usernames.join(', '));
    }
    console.log('Resolve these (e.g. by un-verifying all but one account) before creating the index.');
    return;
  }

  console.log('No duplicate verified emails.');

  if (!apply) {
    console.log(`Dry run: would create index ${INDEX_NAME}. Re-run with --apply to create it.`);
    return;
  }

  console.log('Created index', await users.createIndex(
    { email: 1 },
    {
      name: INDEX_NAME,
      unique: true,
      partialFilterExpression: { verifiedEmail: true },
      collation: emailCollation
    }
  ));
}

const argv = yargs(process.argv.slice(2))
  .command(
    '$0',
    'Create the case-insensitive unique index on verified user emails',
    (yargs) =>
      yargs.option('apply', {
        description: 'create the index; without this flag, only check for duplicates',
        type: 'boolean',
        default: false
      })
  )
  .help()
  .alias('help', 'h')
  .argv;

await createUserIndexes(argv.apply);
await closeConnection();
