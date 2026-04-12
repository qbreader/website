import { closeConnection } from '../../database/databases.js';
import { bonuses, tossups } from '../../database/qbreader/collections.js';

import yargs from 'yargs/yargs';

/**
 * Replaces all <em> and </em> tags with <i> and </i> tags in the 'answer' fields of tossups
 * and the 'answers' arrays of bonuses in the database.
 *
 * @param {boolean} [performUpdates=false] - If true, updates the database; otherwise, only logs changes.
 * @returns {Promise<void>} Resolves when processing is complete.
 */
async function fixEmTag (performUpdates = false) {
  const findRegex = /<em>/g;

  console.log('tossups with <em> found:', await tossups.countDocuments({ answer: findRegex }));
  for (const tossup of await tossups.find({ answer: findRegex }).toArray()) {
    const answer = tossup.answer.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>');
    if (!performUpdates) {
      console.log(`${tossup._id}: ${tossup.answer}`);
      console.log(`                      ->: ${answer}`);
      break;
    }
    await tossups.updateOne({ _id: tossup._id }, { $set: { answer } });
  }

  console.log('bonuses with <em> found:', await bonuses.countDocuments({ answers: findRegex }));
  for (const bonus of await bonuses.find({ answers: findRegex }).toArray()) {
    const answers = bonus.answers.map(answer => answer.replace(/<em>/g, '<i>').replace(/<\/em>/g, '</i>'));
    if (!performUpdates) {
      console.log(`${bonus._id}: ${bonus.answers}`);
      console.log(`                      ->: ${answers}`);
      break;
    }
    await bonuses.updateOne({ _id: bonus._id }, { $set: { answers } });
  }
}

const argv = yargs(process.argv.slice(2))
  .option('confirm', {
    alias: 'c',
    type: 'boolean',
    description: 'Confirm that you want to replace <em> tags with <i> tags'
  })
  .help()
  .alias('help', 'h')
  .argv;

await fixEmTag(argv.confirm);
await closeConnection();
