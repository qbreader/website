import { sets } from './collections.js';

/**
 * @param {String} setName
 * @returns {Promise<{ _id: ObjectId, name: string } | null>} the set, or null if it doesn't exist
 */
async function getSet (setName) {
  return await sets.findOne({ name: setName });
}

export default getSet;
