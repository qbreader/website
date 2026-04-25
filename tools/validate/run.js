import alternateSubcategoryValidation from './alternate-subcategory.js';
import bonusesValidation from './bonuses.js';
import categoryValidation from './category.js';
import packetValidation from './packets.js';
import setValidation from './sets.js';
import subcategoryValidation from './subcategory.js';
import { closeConnection } from '../../database/databases.js';

import yargs from 'yargs/yargs';

export default async function everythingValidation (run) {
  if (!run) { return 0; }

  let total = 0;

  total += await alternateSubcategoryValidation();
  total += await bonusesValidation();
  total += await categoryValidation();
  total += await packetValidation();
  total += await setValidation();
  total += await subcategoryValidation();

  return total;
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

if (!argv.confirm) {
  console.log('Use the --confirm flag to run this script and fix errors.');
}
const count = await everythingValidation(argv.confirm);
console.log(`fixed ${count} total errors.`);
await closeConnection();
