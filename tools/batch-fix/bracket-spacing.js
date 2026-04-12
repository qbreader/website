import { closeConnection } from '../../database/databases.js';
import { bonuses, tossups } from '../../database/qbreader/collections.js';
import removeHTML from '../../shared/remove-html.js';
import unformatString from '../../shared/unformat-string.js';

import yargs from 'yargs/yargs';

const findRegex = /[A-Za-z0-9>\])][[(][^)\]]*[)\]]$/g;
const replaceRegex = /(?<=[A-Za-z0-9>\])])(?=[[(])/g;

/**
 * Fixes missing space between the answer text and the start of a parenthetical or bracketed section in the answer fields of questions.
 */
export default async function fixBracketSpacing (performUpdates) {
  console.log('errant tossups found:', await tossups.countDocuments({ answer: findRegex, answer_sanitized: findRegex }));
  for (const tossup of await tossups.find({ answer: findRegex, answer_sanitized: findRegex }).toArray()) {
    const answer = tossup.answer.replace(replaceRegex, ' ');
    const answerSanitized = unformatString(removeHTML(answer));
    if (!performUpdates) {
      console.log(`${tossup._id}: ${tossup.answer}`);
      console.log(`                      ->: ${answer}`);
      console.log(`                        : ${tossup.answer_sanitized}`);
      console.log(`                      ->: ${answerSanitized}`);
      break;
    }
    await tossups.updateOne(
      { _id: tossup._id },
      { $set: { answer, answer_sanitized: answerSanitized } }
    );
  }

  console.log('errant bonuses found:', await bonuses.countDocuments({ answers: findRegex, answers_sanitized: findRegex }));
  for (const bonus of await bonuses.find({ answers: findRegex, answers_sanitized: findRegex }).toArray()) {
    const answers = bonus.answers.map(answer => answer.replace(replaceRegex, ' '));
    const answersSanitized = answers.map(answer => unformatString(removeHTML(answer)));
    if (!performUpdates) {
      console.log(`${bonus._id}: ${bonus.answers}`);
      console.log(`                      ->: ${answers}`);
      console.log(`                        : ${bonus.answers_sanitized}`);
      console.log(`                      ->: ${answersSanitized}`);
      break;
    }
    await bonuses.updateOne(
      { _id: bonus._id },
      { $set: { answers, answers_sanitized: answersSanitized } }
    );
  }
}

const argv = yargs(process.argv.slice(2))
  .option('confirm', {
    alias: 'c',
    type: 'boolean',
    description: 'Confirm that you want to fix spacing around brackets and parentheses in answer fields'
  })
  .help()
  .alias('help', 'h')
  .argv;

await fixBracketSpacing(argv.confirm);
await closeConnection();
