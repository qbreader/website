import { bonuses, tossups } from './collections.js';

import { ObjectId } from 'mongodb';

/**
 * Report question with given id to the database.
 * @param {string} _id - the id of the question to report
 * @param {'wrong-category' | 'text-error' | 'answer-checking' | 'other'} reason - the reason for reporting
 * @param {string} description - a description of the problem
 * @param {boolean} [verbose=true] - whether to log the result to the console
 * @returns {Promise<boolean>} true if successful, false otherwise.
 */
async function reportQuestion (_id, reason, description, verbose = true) {
  await tossups.updateOne({ _id: new ObjectId(_id) }, {
    $push: {
      reports: {
        reason,
        description
      }
    }
  });

  await bonuses.updateOne({ _id: new ObjectId(_id) }, {
    $push: {
      reports: {
        reason,
        description
      }
    }
  });

  if (verbose) {
    console.log('Reported question with id ' + _id);
  }

  return true;
}

export default reportQuestion;
