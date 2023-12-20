import { bonuses } from './collections.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

// eslint-disable-next-line no-unused-vars
import { ObjectId } from 'mongodb';

/**
 * @param {ObjectId} _id - the id of the bonus
 * @returns {Promise<types.Bonus>}
 */
async function getBonus(_id) {
    return await bonuses.findOne({ _id: _id });
}

export default getBonus;
