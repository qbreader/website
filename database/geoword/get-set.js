import { sets } from './collections.js';

/**
 * @param {String} setName
 * @returns {Promise<{ _id: ObjectId, name: string } | null>}
 */
async function getSet (setName) {
  return await sets.findOne({ name: setName });
}

export default getSet;
