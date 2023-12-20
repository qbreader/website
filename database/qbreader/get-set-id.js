import { sets } from './collections.js';

// eslint-disable-next-line no-unused-vars
import { ObjectId } from 'mongodb';

/**
 * @param {string} name - the name of the set
 * @returns {ObjectId | null}
 */
async function getSetId(name) {
    const set = await sets.findOne({ name });
    return set ? set._id : null;
}

export default getSetId;
