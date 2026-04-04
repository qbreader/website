// write a command-line tool that calls upsert-set.js
import upsertSet from './upsert-set.js';

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .command(
    '$0 [setName] [difficulty]',
    'Upload a set',
    (yargs) =>
      yargs
        .positional('set-name', {
          description: 'the name of the set to upload, e.g. "2024 NAQT HSNCT Finals"',
          type: 'string'
        })
        .positional('difficulty', {
          description: 'the difficulty of the set, as a number from 0 to 10. This parameter is ignored if the set already exists.',
          type: 'number'
        })
  )
  .option('preserveCategory', {
    alias: 'p',
    description: 'whether to preserve the category of existing questions of tossups and bonuses. Defaults to `false`.',
    type: 'boolean',
    default: false
  })
  .option('standard', {
    description: 'whether the set is a standard set. Defaults to true. This parameter is ignored if the set already exists.',
    type: 'boolean',
    default: true
  })
  .option('zeroIndexQuestions', {
    description: 'whether question numbering starts at 0 or 1. Defaults to 1 (i.e. zeroIndexQuestions = false).',
    type: 'boolean',
    default: false
  })
  .option('folderPath', {
    alias: 'f',
    description: 'the folder that the set is in. Defaults to the current directory.',
    type: 'string',
    default: './'
  })
  .check((argv) => {
    if (argv._.length > 2) {
      throw new Error('Too many positional arguments. Expected at most: setName and difficulty');
    }
    if (!argv.setName) throw new Error('Missing required argument: setName');
    if (argv.difficulty === undefined) throw new Error('Missing required argument: difficulty');
    return true;
  })
  .help()
  .alias('help', 'h')
  .argv;

const setAlreadyExists = await upsertSet(argv.setName, argv.difficulty, { preserveCategory: argv.preserveCategory, standard: argv.standard, zeroIndexQuestions: argv.zeroIndexQuestions, folderPath: argv.folderPath });
console.log(`Uploaded ${argv.setName} with parameters: preserveCategory=${argv.preserveCategory}, standard=${argv.standard}, zeroIndexQuestions=${argv.zeroIndexQuestions}`);
console.log(setAlreadyExists ? 'Set already exists. Updated existing set.' : 'Set did not already exist. Created new set.');
