import { tossups } from './collections.js';

// eslint-disable-next-line no-unused-vars
import * as types from '../../types.js';

// eslint-disable-next-line no-unused-vars
import { ObjectId } from 'mongodb';

/**
 * @param {ObjectId} _id - the id of the tossup
 * @returns {Promise<types.Tossup>}
 */
async function getTossup(_id) {
    return await tossups.findOne({ _id: _id });
}

export default getTossup;
